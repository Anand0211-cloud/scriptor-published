import * as pdfjs from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import type { ScriptBlock, BlockType } from '../hooks/useEditor';

// Use local worker via Vite's ?url import for reliability
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface ParsedLine {
    text: string;
    x: number;
    y: number;
    isAllCaps: boolean;
}

export interface ImportProgress {
    phase: string;
    current: number;
    total: number;
}

export async function parseScriptPDF(
    file: File,
    maxPages = 10,
    onProgress?: (p: ImportProgress) => void
): Promise<{ title: string; blocks: ScriptBlock[] }> {
    console.log('[PDF Import] Starting import for:', file.name, 'Size:', file.size);

    onProgress?.({ phase: 'Reading file...', current: 0, total: 1 });

    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF Import] File read into memory. Bytes:', arrayBuffer.byteLength);

    onProgress?.({ phase: 'Loading PDF...', current: 0, total: 1 });

    let pdf;
    try {
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        pdf = await loadingTask.promise;
    } catch (err) {
        console.error('[PDF Import] Failed to load PDF document:', err);
        throw new Error('Could not open this PDF file. It may be corrupted or password-protected.');
    }

    const numPages = Math.min(pdf.numPages, maxPages);
    console.log(`[PDF Import] PDF loaded. Total pages: ${pdf.numPages}. Processing: ${numPages}`);

    let allBlocks: ScriptBlock[] = [];

    for (let i = 1; i <= numPages; i++) {
        onProgress?.({ phase: `Processing page ${i} of ${numPages}...`, current: i, total: numPages });
        console.log(`[PDF Import] Processing page ${i}/${numPages}`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        let pageLines: ParsedLine[] = [];

        // Check if page has selectable text (more than a few stray items)
        const meaningfulItems = textContent.items.filter((item: any) => item.str?.trim());
        console.log(`[PDF Import] Page ${i}: found ${meaningfulItems.length} text items`);

        if (meaningfulItems.length > 3) {
            pageLines = processPdfTextItems(textContent.items, page.view);
            console.log(`[PDF Import] Page ${i}: extracted ${pageLines.length} lines via text layer`);
        } else {
            // Scanned PDF fallback
            console.log(`[PDF Import] Page ${i}: appears scanned. Running OCR...`);
            onProgress?.({ phase: `OCR on page ${i}...`, current: i, total: numPages });
            try {
                pageLines = await performOCR(page);
                console.log(`[PDF Import] Page ${i}: OCR extracted ${pageLines.length} lines`);
            } catch (ocrErr) {
                console.error(`[PDF Import] Page ${i}: OCR failed:`, ocrErr);
                // Continue to next page rather than failing entirely
            }
        }

        const pageBlocks = classifyLines(pageLines);
        allBlocks = [...allBlocks, ...pageBlocks];
    }

    console.log(`[PDF Import] Total raw blocks: ${allBlocks.length}`);

    // Final merging and cleanup
    const finalBlocks = mergeBlocks(allBlocks);
    console.log(`[PDF Import] Final merged blocks: ${finalBlocks.length}`);

    // If we got no blocks at all, add a default one so the editor isn't empty
    if (finalBlocks.length === 0) {
        finalBlocks.push({
            id: uuidv4(),
            type: 'action',
            content: '(Imported script was empty or could not be parsed)'
        });
    }

    return {
        title: file.name.replace(/\.pdf$/i, ''),
        blocks: finalBlocks
    };
}

function processPdfTextItems(items: any[], _view: number[]): ParsedLine[] {
    // Group by y coordinate (with some tolerance for slight misalignment)
    const lines: Record<number, any[]> = {};
    items.forEach((item: any) => {
        if (!item.str?.trim()) return;

        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item);
    });

    const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a); // Top to bottom

    return sortedY.map(y => {
        const lineItems = lines[y].sort((a: any, b: any) => a.transform[4] - b.transform[4]);
        const text = lineItems.map((item: any) => item.str).join('').trim();
        const x = lineItems[0].transform[4];

        return {
            text,
            x,
            y,
            isAllCaps: text === text.toUpperCase() && /[A-Z]/.test(text)
        };
    });
}

async function performOCR(page: PDFPageProxy): Promise<ParsedLine[]> {
    const viewport = page.getViewport({ scale: 2.0 }); // High scale for better OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create canvas context for OCR');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: context,
        viewport: viewport
    } as any).promise;

    const worker = await createWorker('eng');
    const { data: { blocks } } = await worker.recognize(canvas);
    await worker.terminate();

    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;

    const lines: ParsedLine[] = [];

    blocks?.forEach(block => {
        block.paragraphs.forEach(para => {
            para.lines.forEach(line => {
                const text = line.text.trim();
                if (!text) return;

                // Convert OCR coordinates back to 72dpi equivalent for consistency
                const x = (line.bbox.x0 / viewport.width) * 612; // 8.5" * 72
                const y = (line.bbox.y0 / viewport.height) * 792; // 11" * 72

                lines.push({
                    text,
                    x,
                    y,
                    isAllCaps: text === text.toUpperCase() && /[A-Z]/.test(text)
                });
            });
        });
    });

    return lines.sort((a, b) => a.y - b.y);
}

function classifyLines(lines: ParsedLine[]): ScriptBlock[] {
    return lines.map(line => {
        let type: BlockType = 'action';
        const { text, x, isAllCaps } = line;

        // Screenplay Heuristics (based on 72dpi coordinates)
        // Standard Left Margin is ~108 (1.5")

        if (isAllCaps && (text.startsWith('INT.') || text.startsWith('EXT.') || text.startsWith('INT/EXT') || text.startsWith('I/E'))) {
            type = 'scene';
        } else if (isAllCaps && x > 240 && x < 320) { // Character centered-ish
            type = 'character';
        } else if (x > 160 && x < 200 && !isAllCaps) { // Dialogue indented
            type = 'dialogue';
        } else if (text.startsWith('(') && text.endsWith(')') && x > 180) {
            type = 'parenthetical';
        } else if (isAllCaps && x > 400) {
            type = 'transition';
        }

        return {
            id: uuidv4(),
            type,
            content: text
        };
    });
}

function mergeBlocks(blocks: ScriptBlock[]): ScriptBlock[] {
    if (blocks.length === 0) return [];

    const merged: ScriptBlock[] = [blocks[0]];

    for (let i = 1; i < blocks.length; i++) {
        const current = blocks[i];
        const last = merged[merged.length - 1];

        // Merge consecutive blocks of the same type (action and dialogue only)
        if (current.type === last.type && (current.type === 'action' || current.type === 'dialogue')) {
            last.content += ' ' + current.content;
        } else {
            merged.push(current);
        }
    }

    return merged;
}

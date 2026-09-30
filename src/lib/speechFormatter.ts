import type { BlockType } from '../hooks/useEditor';

/**
 * Replace spoken punctuation words with actual punctuation characters.
 */
export function cleanSpokenPunctuation(rawText: string): string {
    let text = rawText;

    // Spoken punctuation replacements (case-insensitive with word boundaries)
    const replacements: [RegExp, string][] = [
        [/\b(full stop|period)\b/gi, '.'],
        [/\bcomma\b/gi, ','],
        [/\bquestion mark\b/gi, '?'],
        [/\b(exclamation mark|exclamation point)\b/gi, '!'],
        [/\bcolon\b/gi, ':'],
        [/\bsemicolon\b/gi, ';'],
        [/\b(ellipsis|dot dot dot)\b/gi, '...'],
        [/\b(em dash|dash|hyphen)\b/gi, ' - '],
        [/\b(open quote|open quotation|start quote)\b/gi, '"'],
        [/\b(close quote|close quotation|end quote)\b/gi, '"'],
        [/\b(open parenthesis|open paren)\b/gi, '('],
        [/\b(close parenthesis|close paren)\b/gi, ')']
    ];

    for (const [pattern, replacement] of replacements) {
        text = text.replace(pattern, replacement);
    }

    // Fix spacing around punctuation:
    // Remove space before punctuation marks: "hello ." -> "hello."
    text = text.replace(/\s+([.,!?:;)])/g, '$1');
    // Ensure space after punctuation marks if followed by a letter: "hello.world" -> "hello. world"
    text = text.replace(/([.,!?:;])([A-Za-z])/g, '$1 $2');
    // Remove space after open parenthesis: "( hello" -> "(hello"
    text = text.replace(/\(\s+/g, '(');
    // Remove duplicate spaces
    text = text.replace(/\s{2,}/g, ' ');

    return text.trim();
}

/**
 * Standardize scene abbreviations if spoken in scene headings.
 */
function cleanSceneText(text: string): string {
    let upper = text.toUpperCase();

    // Standardize Interior / Exterior
    upper = upper.replace(/\bINTERIOR\b/g, 'INT.');
    upper = upper.replace(/\bEXTERIOR\b/g, 'EXT.');
    upper = upper.replace(/\bINT\s*\/\s*EXT\b/g, 'INT./EXT.');
    upper = upper.replace(/\bINTERIOR\s*\/\s*EXTERIOR\b/g, 'INT./EXT.');

    // Common separators if spoken like "dash"
    upper = upper.replace(/\s+-\s+/g, ' - ');

    return upper;
}

/**
 * Standardize transitions if spoken.
 */
function cleanTransitionText(text: string): string {
    const upper = text.toUpperCase().trim();
    if (upper === 'CUT TO' || upper === 'CUT TO.') return 'CUT TO:';
    if (upper === 'FADE OUT' || upper === 'FADE OUT:') return 'FADE OUT.';
    if (upper === 'FADE IN' || upper === 'FADE IN.') return 'FADE IN:';
    if (upper === 'DISSOLVE TO' || upper === 'DISSOLVE TO.') return 'DISSOLVE TO:';
    if (upper === 'SMASH CUT TO' || upper === 'SMASH CUT TO.') return 'SMASH CUT TO:';
    return upper;
}

/**
 * Format spoken text specifically for a screenplay block type and combine with existing block content.
 */
export function formatSpeechForBlock(
    spokenText: string,
    currentContent: string,
    blockType: BlockType
): string {
    const cleanedText = cleanSpokenPunctuation(spokenText);
    if (!cleanedText) return currentContent;

    switch (blockType) {
        case 'scene': {
            const formatted = cleanSceneText(cleanedText);
            if (!currentContent.trim()) {
                return formatted;
            }
            const needsSpace = !currentContent.endsWith(' ') && !currentContent.endsWith('-');
            return `${currentContent}${needsSpace ? ' ' : ''}${formatted}`;
        }

        case 'character': {
            // Character cues are strictly UPPERCASE without trailing periods
            let formatted = cleanedText.toUpperCase().replace(/[.,!?:;]$/, '').trim();
            if (!currentContent.trim()) {
                return formatted;
            }
            const needsSpace = !currentContent.endsWith(' ');
            return `${currentContent}${needsSpace ? ' ' : ''}${formatted}`;
        }

        case 'parenthetical': {
            // Parentheticals are strictly lowercase inside ( ... )
            const rawSpoken = cleanedText.replace(/[()]/g, '').trim().toLowerCase();
            const existingRaw = currentContent.replace(/[()]/g, '').trim();

            if (!existingRaw) {
                return `(${rawSpoken})`;
            }
            return `(${existingRaw} ${rawSpoken})`;
        }

        case 'transition': {
            const formatted = cleanTransitionText(cleanedText);
            if (!currentContent.trim()) {
                return formatted;
            }
            const needsSpace = !currentContent.endsWith(' ');
            return `${currentContent}${needsSpace ? ' ' : ''}${formatted}`;
        }

        case 'shot': {
            const formatted = cleanedText.toUpperCase();
            if (!currentContent.trim()) {
                return formatted;
            }
            const needsSpace = !currentContent.endsWith(' ');
            return `${currentContent}${needsSpace ? ' ' : ''}${formatted}`;
        }

        case 'dialogue':
        case 'action':
        default: {
            // Natural sentence case
            let formatted = cleanedText;

            // Capitalize first character if currentContent is empty or ends with sentence terminator (. ! ?)
            const shouldCapitalizeFirst =
                !currentContent.trim() ||
                /[.!?]\s*$/.test(currentContent.trim());

            if (shouldCapitalizeFirst && formatted.length > 0) {
                formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
            }

            if (!currentContent.trim()) {
                return formatted;
            }

            const needsSpace = !currentContent.endsWith(' ');
            return `${currentContent}${needsSpace ? ' ' : ''}${formatted}`;
        }
    }
}

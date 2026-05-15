import { useParams } from 'react-router-dom';
import { useEditor } from '../hooks/useEditor';
import Block from '../components/Block';
import ScriptNavigator from '../components/ScriptNavigator';
import { Download, Save, ArrowLeft, Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useRef, useCallback, useState, useMemo } from 'react';

export default function Editor() {
    const { id } = useParams();
    const { blocks, title, setTitle, loading, saving, saveScript, updateBlock, changeType, handleEnter, handleBackspaceAtStart, handleTab, focusedId, setFocusedId } = useEditor(id);
    const editorRef = useRef<HTMLDivElement>(null);
    const [showNavigator, setShowNavigator] = useState(true);

    const handleFocused = useCallback(() => {
        setFocusedId(null);
    }, [setFocusedId]);

    // Extract unique character names for autocomplete
    const characterNames = useMemo(() => {
        const names = new Set<string>();
        blocks.forEach(b => {
            if (b.type === 'character' && b.content.trim()) {
                names.add(b.content.trim().toUpperCase());
            }
        });
        return Array.from(names).sort();
    }, [blocks]);

    // Scroll to a specific block by ID (smooth scroll, no cursor focus)
    const scrollToBlock = useCallback((blockId: string) => {
        const el = document.querySelector(`[data-block-id="${blockId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Brief highlight flash
            el.classList.add('scroll-highlight');
            setTimeout(() => el.classList.remove('scroll-highlight'), 1500);
        }
    }, []);

    const handleDownloadPDF = () => {
        const doc = new jsPDF({
            unit: 'in',
            format: 'letter',
        });

        doc.setFont('Courier', 'normal');
        doc.setFontSize(12);

        let y = 1.0;
        const lineHeight = 0.166;

        blocks.forEach(block => {
            let x = 1.5;
            let text = block.content;

            if (!text) return;

            if (block.type === 'scene') {
                doc.setFont('Courier', 'bold');
                text = text.toUpperCase();
                y += lineHeight * 2;
            } else {
                doc.setFont('Courier', 'normal');
            }

            if (block.type === 'character') {
                x = 3.7;
                text = text.toUpperCase();
                y += lineHeight;
            }

            if (block.type === 'dialogue') {
                x = 2.5;
            }

            if (block.type === 'parenthetical') {
                x = 3.1;
            }

            if (block.type === 'transition') {
                x = 5.5;
                text = text.toUpperCase();
                y += lineHeight;
            }

            if (y > 10) {
                doc.addPage();
                y = 1.0;
            }

            const splitText = doc.splitTextToSize(text, 8.5 - x - 1.0);
            if (block.type === 'dialogue') {
                const diagSplit = doc.splitTextToSize(text, 3.5);
                doc.text(diagSplit, x, y);
                y += (diagSplit.length * lineHeight);
            } else {
                doc.text(splitText, x, y);
                y += (splitText.length * lineHeight);
            }

            if (block.type === 'dialogue') y += lineHeight;
        });

        doc.save(`script-${id}.pdf`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300 overflow-hidden">
            {/* Toolbar */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-3 md:px-6 z-20 w-full shadow-sm shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <Link to="/" className="p-1 md:p-2 -ml-1 md:-ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    {/* Navigator toggle */}
                    <button
                        onClick={() => setShowNavigator(prev => !prev)}
                        className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title={showNavigator ? 'Hide Navigator' : 'Show Navigator'}
                    >
                        {showNavigator ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeft className="h-4.5 w-4.5" />}
                    </button>

                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                    <div className="flex flex-col overflow-hidden">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wide focus:ring-0 p-0 m-0 w-[140px] sm:w-48 md:w-64 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors truncate"
                            placeholder="Untitled Screenplay"
                        />
                        <div className="flex items-center gap-2">
                            {saving ? (
                                <span className="text-[10px] uppercase tracking-wider text-yellow-500 font-medium flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Saving
                                </span>
                            ) : (
                                <>
                                    <span className="text-[10px] uppercase tracking-wider text-green-500 font-medium">Online</span>
                                    <span className="text-[10px] text-gray-400">All changes saved</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        title="Save to Cloud"
                        onClick={saveScript}
                        disabled={saving}
                        className="p-2 md:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4.5 w-4.5 md:h-5 md:w-5" />
                    </button>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg shadow transition-all hover:shadow-lg active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </header>

            {/* Main Content: Navigator Sidebar + Editor Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Script Navigator Sidebar */}
                {showNavigator && (
                    <ScriptNavigator
                        blocks={blocks}
                        onScrollToBlock={scrollToBlock}
                    />
                )}

                {/* Editor Workspace */}
                <div className="flex-1 overflow-auto py-6 sm:py-10 px-2 sm:px-6 pb-24 sm:pb-10 flex justify-center bg-gray-100 dark:bg-gray-950 relative">
                    {/* Texture overlay for "desk" feel */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

                <div className="screenplay-page bg-white shadow-2xl min-h-0 md:min-h-[11in] w-full max-w-[8.5in] relative z-10 transition-shadow duration-300 overflow-x-hidden">
                        <div ref={editorRef} className="font-mono text-[14px] md:text-[12pt] text-black leading-tight">
                            {blocks.map(block => (
                                <Block
                                    key={block.id}
                                    block={block}
                                    onUpdate={updateBlock}
                                    onEnter={handleEnter}
                                    onBackspaceAtStart={handleBackspaceAtStart}
                                    onTab={handleTab}
                                    onChangeType={changeType}
                                    autoFocus={focusedId === block.id}
                                    onFocused={handleFocused}
                                    characterNames={characterNames}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useParams } from 'react-router-dom';
import { useEditor, TYPE_MAP } from '../hooks/useEditor';
import type { BlockType } from '../hooks/useEditor';
import Block from '../components/Block';
import ScriptNavigator from '../components/ScriptNavigator';
import { Download, Save, ArrowLeft, Loader2, PanelLeftClose, PanelLeft, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';

const ALL_TYPES: BlockType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'shot'];

export default function Editor() {
    const { id } = useParams();
    const {
        blocks,
        title,
        setTitle,
        loading,
        saving,
        saveScript,
        updateBlock,
        changeType,
        handleEnter,
        handleBackspaceAtStart,
        handleTab,
        focusedId,
        setFocusedId,
        autofocusId,
        setAutofocusId
    } = useEditor(id);
    const editorRef = useRef<HTMLDivElement>(null);
    const [showNavigator, setShowNavigator] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
    const [visualViewportOffset, setVisualViewportOffset] = useState(0);
    const [showMobileFormatMenu, setShowMobileFormatMenu] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Close mobile format menu when clicking outside
    useEffect(() => {
        if (!showMobileFormatMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
                setShowMobileFormatMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMobileFormatMenu]);

    // Close mobile format menu when focus changes
    useEffect(() => {
        setShowMobileFormatMenu(false);
    }, [focusedId]);

    // Track visual viewport changes on mobile to slide the formatting toolbar above the keyboard
    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const handleViewportChange = () => {
            const vv = window.visualViewport;
            if (!vv) return;
            // Calculate height of virtual keyboard (and any browser bottom bars)
            const offset = window.innerHeight - vv.height;
            setVisualViewportOffset(Math.max(0, offset));
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
        
        // Initial run
        handleViewportChange();

        return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportChange);
            window.visualViewport?.removeEventListener('scroll', handleViewportChange);
        };
    }, []);

    // Prevent body/html scrolling on mobile to keep focus alignment stable when keyboard opens
    useEffect(() => {
        if (typeof window === 'undefined' || window.innerWidth >= 768) return;
        
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalHtmlHeight = document.documentElement.style.height;
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyHeight = document.body.style.height;

        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';

        return () => {
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.documentElement.style.height = originalHtmlHeight;
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.height = originalBodyHeight;
        };
    }, []);

    const handleFocused = useCallback(() => {
        setAutofocusId(null);
    }, [setAutofocusId]);

    // Enforce horizontal scroll position is always 0 on the scroll container to prevent browser layout shifts
    useEffect(() => {
        const container = editorRef.current?.closest('.overflow-y-auto');
        if (!container) return;
        const handleScroll = () => {
            if (container.scrollLeft !== 0) {
                container.scrollLeft = 0;
            }
        };
        container.addEventListener('scroll', handleScroll);
        // Do a clean check immediately
        container.scrollLeft = 0;
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loading]);

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
        if (el && el instanceof HTMLElement) {
            const container = el.closest('.overflow-y-auto');
            if (container) {
                const elementRect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const elementTopInContainer = elementRect.top - containerRect.top + container.scrollTop;
                const targetScrollTop = elementTopInContainer - (containerRect.height / 2) + (elementRect.height / 2);
                container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                container.scrollLeft = 0;
            }
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
                        className="flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
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
            <div className="flex-1 flex overflow-hidden relative">
                {/* Mobile Navigator Backdrop */}
                {showNavigator && (
                    <div
                        className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setShowNavigator(false)}
                    />
                )}

                {/* Script Navigator Sidebar */}
                {showNavigator && (
                    <ScriptNavigator
                        blocks={blocks}
                        onScrollToBlock={(blockId) => {
                            scrollToBlock(blockId);
                            // Auto-close navigator on mobile after clicking
                            if (window.innerWidth < 768) {
                                setShowNavigator(false);
                            }
                        }}
                        onClose={() => setShowNavigator(false)}
                    />
                )}

                {/* Editor Workspace */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 md:pt-10 px-4 md:px-6 pb-4 md:pb-10 flex justify-center bg-gray-100 dark:bg-gray-950 relative">
                    {/* Texture overlay for "desk" feel */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

                    <div className="screenplay-page w-full max-w-[8.5in] relative z-10 transition-shadow duration-300 overflow-x-hidden">
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
                                    autoFocus={autofocusId === block.id}
                                    onFocused={handleFocused}
                                    onFocusActive={setFocusedId}
                                    onBlurActive={(id) => {
                                        setFocusedId(current => current === id ? null : current);
                                    }}
                                    characterNames={characterNames}
                                />
                            ))}
                            {/* Page Bottom Spacer to allow typewriter-style scrolling past the end */}
                            <div className="h-[60vh] md:h-[80vh] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Formatting Toolbar for Mobile */}
                {focusedId !== null && (
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden fixed left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between select-none shrink-0"
                        style={{
                            bottom: `${visualViewportOffset}px`,
                            paddingBottom: visualViewportOffset > 0 ? '12px' : 'calc(12px + env(safe-area-inset-bottom))',
                            transition: 'bottom 80ms ease-out'
                        }}
                    >
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Formatting
                        </span>

                        <div className="relative">
                            {/* Trigger Button */}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setShowMobileFormatMenu(prev => !prev);
                                }}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all duration-150 active:scale-95 shadow-sm',
                                    'bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
                                )}
                            >
                                <span className={clsx(
                                    'w-2 h-2 rounded-full shrink-0',
                                    (() => {
                                        const type = blocks.find(b => b.id === focusedId)?.type;
                                        if (type === 'scene') return 'bg-amber-600';
                                        if (type === 'action') return 'bg-slate-600';
                                        if (type === 'character') return 'bg-violet-600';
                                        if (type === 'dialogue') return 'bg-emerald-600';
                                        if (type === 'parenthetical') return 'bg-cyan-600';
                                        if (type === 'transition') return 'bg-rose-600';
                                        if (type === 'shot') return 'bg-orange-600';
                                        return 'bg-gray-400';
                                    })()
                                )} />
                                {(() => {
                                    const type = blocks.find(b => b.id === focusedId)?.type;
                                    return type ? TYPE_MAP[type] : '';
                                })()}
                                {showMobileFormatMenu ? (
                                    <ChevronUp className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                )}
                            </button>

                            {/* Custom Floating Dropdown (opens upward) */}
                            {showMobileFormatMenu && (
                                <div className="absolute right-0 bottom-full mb-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl py-2 min-w-[200px] overflow-hidden max-h-[300px] overflow-y-auto">
                                    <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Choose Style</span>
                                    </div>
                                    {ALL_TYPES.map(type => {
                                        const isCurrent = blocks.find(b => b.id === focusedId)?.type === type;
                                        const label = TYPE_MAP[type];
                                        
                                        const dotColor: Record<BlockType, string> = {
                                            scene:         'bg-amber-600',
                                            action:        'bg-slate-600',
                                            character:     'bg-violet-600',
                                            dialogue:      'bg-emerald-600',
                                            parenthetical: 'bg-cyan-600',
                                            transition:    'bg-rose-600',
                                            shot:          'bg-orange-600',
                                        };

                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    // Prevent losing focus from editor text area
                                                    e.preventDefault();
                                                    changeType(focusedId, type);
                                                    setShowMobileFormatMenu(false);
                                                }}
                                                className={clsx(
                                                    'w-full text-left px-3 py-2.5 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer select-none',
                                                    isCurrent
                                                        ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                                                )}
                                            >
                                                <span className={clsx(
                                                    'w-2 h-2 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900',
                                                    dotColor[type],
                                                    isCurrent ? 'ring-current' : 'ring-transparent'
                                                )} />
                                                <span className="uppercase tracking-wide">{label}</span>
                                                {isCurrent && (
                                                    <Check className="ml-auto h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 font-bold" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

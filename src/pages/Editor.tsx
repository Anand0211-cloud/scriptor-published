import { useParams } from 'react-router-dom';
import { useEditor } from '../hooks/useEditor';
import type { BlockType } from '../hooks/useEditor';
import Block from '../components/Block';
import ScriptNavigator from '../components/ScriptNavigator';
import DraftsPanel from '../components/DraftsPanel';
import CreateDraftModal from '../components/CreateDraftModal';
import { Download, Save, ArrowLeft, Loader2, PanelLeftClose, PanelLeft, Layers, Mic, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { formatSpeechForBlock } from '../lib/speechFormatter';
import { TYPE_MAP } from '../hooks/useEditor';

const ALL_TYPES: BlockType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'shot'];

export default function Editor() {
    const { id } = useParams();
    const {
        blocks,
        title,
        setTitle,
        loading,
        saving,
        drafts,
        activeDraftId,
        activeDraft,
        availableScenes,
        saveScript,
        switchDraft,
        createDraft,
        renameDraft,
        duplicateDraft,
        deleteDraft,
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
    const [showDraftsPanel, setShowDraftsPanel] = useState(false);
    const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
    const [visualViewportOffset, setVisualViewportOffset] = useState(0);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Track blocks and focus in refs to ensure speech callbacks always write to the current target block
    const blocksRef = useRef(blocks);
    const focusedIdRef = useRef(focusedId);
    const lastFocusedIdRef = useRef<string | null>(null);

    useEffect(() => {
        blocksRef.current = blocks;
    }, [blocks]);

    useEffect(() => {
        focusedIdRef.current = focusedId;
        if (focusedId) {
            lastFocusedIdRef.current = focusedId;
        }
    }, [focusedId]);

    // Handle incoming finalized speech text and apply format-specific rules
    const handleSpeechFinalResult = useCallback((phrase: string) => {
        const targetId = focusedIdRef.current || lastFocusedIdRef.current || blocksRef.current[blocksRef.current.length - 1]?.id;
        if (!targetId) return;

        const currentBlock = blocksRef.current.find(b => b.id === targetId);
        if (!currentBlock) return;

        const updatedContent = formatSpeechForBlock(phrase, currentBlock.content, currentBlock.type);
        updateBlock(targetId, updatedContent);

        // Maintain cursor focus
        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-block-id="${targetId}"] [contenteditable="true"]`) as HTMLElement | null;
            if (el && document.activeElement !== el) {
                el.focus({ preventScroll: true });
            }
        });
    }, [updateBlock]);

    const {
        isListening,
        isSupported,
        interimTranscript,
        audioLevel,
        error: speechError,
        startListening,
        stopListening,
        clearError: clearSpeechError
    } = useSpeechToText({
        onFinalResult: handleSpeechFinalResult
    });

    const handleToggleDictation = useCallback(() => {
        if (!isSupported) {
            alert('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari for voice dictation.');
            return;
        }

        if (isListening) {
            stopListening();
        } else {
            const targetId = focusedId || lastFocusedIdRef.current || blocksRef.current[blocksRef.current.length - 1]?.id;
            if (targetId) {
                lastFocusedIdRef.current = targetId;
                setFocusedId(targetId);
                requestAnimationFrame(() => {
                    const el = document.querySelector(`[data-block-id="${targetId}"] [contenteditable="true"]`) as HTMLElement | null;
                    el?.focus({ preventScroll: true });
                });
            }
            startListening();
        }
    }, [isSupported, isListening, focusedId, setFocusedId, startListening, stopListening]);

    // Alt+M Keyboard Shortcut for quick hands-free dictation toggle
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) {
                e.preventDefault();
                handleToggleDictation();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleToggleDictation]);

    // Active block being dictated into for format indicator badge
    const activeDictationBlock = useMemo(() => {
        const targetId = focusedId || lastFocusedIdRef.current;
        return blocks.find(b => b.id === targetId) || blocks[0];
    }, [blocks, focusedId]);

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
                    {/* Drafts & Versions Toggle Button */}
                    <button
                        onClick={() => setShowDraftsPanel(prev => !prev)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg border text-xs font-semibold transition-all ${showDraftsPanel
                            ? 'bg-accent-500/15 border-accent-500/50 text-accent-600 dark:text-accent-400 shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                            }`}
                        title="Manage Drafts & Versions"
                    >
                        <Layers className="h-4 w-4 text-accent-500 shrink-0" />
                        <span className="max-w-[100px] sm:max-w-[140px] truncate hidden sm:inline">
                            {activeDraft?.name || 'Drafts'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent-500/20 text-accent-500 font-mono font-bold">
                            {drafts.length}
                        </span>
                    </button>

                    {/* Voice Dictation (Speech-to-Text) Toggle */}
                    <button
                        onClick={handleToggleDictation}
                        className={clsx(
                            'flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none',
                            isListening
                                ? 'bg-red-500/15 border-red-500/60 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/20 ring-2 ring-red-400/40'
                                : 'bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        )}
                        title={isListening ? 'Stop Voice Dictation (Alt+M)' : 'Start Voice Dictation in English (Alt+M)'}
                    >
                        {isListening ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <Mic className="h-4 w-4 text-red-500 animate-pulse shrink-0" />
                                <span className="font-bold text-red-600 dark:text-red-400 hidden sm:inline">Listening</span>
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                                <span className="hidden sm:inline">Dictate</span>
                            </>
                        )}
                    </button>

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

            {/* Speech-to-Text Error Banner */}
            {speechError && (
                <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 md:px-6 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between z-30 shrink-0">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>{speechError}</span>
                    </div>
                    <button
                        onClick={clearSpeechError}
                        className="p-1 hover:bg-amber-500/20 rounded transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

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

                {/* Mobile Drafts Backdrop */}
                {showDraftsPanel && (
                    <div
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setShowDraftsPanel(false)}
                    />
                )}

                {/* Drafts & Versions Sidebar Panel */}
                {showDraftsPanel && (
                    <DraftsPanel
                        isOpen={showDraftsPanel}
                        onClose={() => setShowDraftsPanel(false)}
                        drafts={drafts}
                        activeDraftId={activeDraftId}
                        onSwitchDraft={switchDraft}
                        onOpenCreateModal={() => setShowCreateDraftModal(true)}
                        onRenameDraft={renameDraft}
                        onDuplicateDraft={duplicateDraft}
                        onDeleteDraft={deleteDraft}
                    />
                )}

                {/* Sticky Bottom Formatting Toolbar for Mobile */}
                {focusedId !== null && (
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden fixed left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-[0_-8px_20px_rgba(0,0,0,0.15)] px-2.5 py-2 select-none shrink-0"
                        style={{
                            bottom: `${visualViewportOffset}px`,
                            paddingBottom: visualViewportOffset > 0 ? '8px' : 'calc(8px + env(safe-area-inset-bottom))',
                            transition: 'bottom 80ms ease-out'
                        }}
                    >
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                            {/* Mobile Mic / Voice Dictation Button */}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleToggleDictation();
                                }}
                                className={clsx(
                                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold active:scale-95 transition-all shrink-0 border',
                                    isListening
                                        ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20 animate-pulse'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                                )}
                                title={isListening ? 'Stop Dictating' : 'Start Voice Dictation'}
                            >
                                <Mic className="h-3.5 w-3.5 shrink-0" />
                                <span>{isListening ? 'REC' : 'MIC'}</span>
                            </button>

                            {/* Fast Tab / Cycle Key */}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleTab(focusedId);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 active:scale-95 transition-transform shrink-0"
                                title="Cycle Type (Tab)"
                            >
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">TAB</span> ⇥
                            </button>

                            {/* Direct Type Pills */}
                            {ALL_TYPES.map(type => {
                                const isCurrent = blocks.find(b => b.id === focusedId)?.type === type;
                                const shortLabels: Record<BlockType, string> = {
                                    scene: 'SCN',
                                    action: 'ACT',
                                    character: 'CHAR',
                                    dialogue: 'DIAG',
                                    parenthetical: 'PAR',
                                    transition: 'TRN',
                                    shot: 'SHOT'
                                };

                                const dotColor: Record<BlockType, string> = {
                                    scene: 'bg-amber-600',
                                    action: 'bg-slate-600',
                                    character: 'bg-violet-600',
                                    dialogue: 'bg-emerald-600',
                                    parenthetical: 'bg-cyan-600',
                                    transition: 'bg-rose-600',
                                    shot: 'bg-orange-600',
                                };

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            changeType(focusedId, type);
                                        }}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer select-none shrink-0 border active:scale-95',
                                            isCurrent
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                                                : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        )}
                                    >
                                        <span className={clsx(
                                            'w-2 h-2 rounded-full shrink-0',
                                            isCurrent ? 'bg-white ring-2 ring-indigo-300' : dotColor[type]
                                        )} />
                                        <span>{shortLabels[type]}</span>
                                    </button>
                                );
                            })}

                            {/* New Line / Next Block Key */}
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleEnter(focusedId, blocks.find(b => b.id === focusedId)?.content || '', '', false);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-accent-500/20 text-accent-500 border border-accent-500/40 active:scale-95 transition-transform shrink-0 ml-auto"
                                title="Insert Next Block"
                            >
                                <span>+ LINE</span> ↵
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Live Dictation Floating Feedback Pill (Centered in Middle of Page) */}
            {isListening && (
                <div
                    className="fixed z-50 pointer-events-none flex flex-col items-center"
                    style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: focusedId !== null && typeof window !== 'undefined' && window.innerWidth < 768
                            ? `${visualViewportOffset + 58}px`
                            : '24px',
                        width: 'max-content',
                        maxWidth: '92vw'
                    }}
                >
                    <div className="bg-gray-900/95 dark:bg-gray-800/95 text-white backdrop-blur-xl border border-gray-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.45)] rounded-2xl p-2.5 sm:px-4 sm:py-3 flex flex-col gap-2 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 w-full min-w-[300px] sm:min-w-[420px]">
                        {/* Top row: Status, Format, Spoken text, Close */}
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            {/* Live recording indicator with live bouncing mini equalizer */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-400">
                                    Listening
                                </span>

                                {/* Mini 4-bar equalizer that directly bounces with audioLevel */}
                                <div className="flex items-end gap-0.5 h-3.5 ml-1">
                                    <div
                                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(3, Math.min(14, 3 + audioLevel * 0.12))}px` }}
                                    />
                                    <div
                                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(4, Math.min(14, 4 + audioLevel * 0.16))}px` }}
                                    />
                                    <div
                                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(3, Math.min(14, 3 + audioLevel * 0.14))}px` }}
                                    />
                                    <div
                                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                        style={{ height: `${Math.max(2, Math.min(14, 2 + audioLevel * 0.10))}px` }}
                                    />
                                </div>
                            </div>

                            <div className="h-3.5 w-px bg-gray-700 shrink-0"></div>

                            {/* Active format pill */}
                            {activeDictationBlock && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-800 border border-gray-700 shrink-0 text-indigo-300">
                                    {TYPE_MAP[activeDictationBlock.type]}
                                </span>
                            )}

                            {/* Live interim preview or prompt */}
                            <div className="text-xs truncate flex-1 min-w-0 font-mono">
                                {interimTranscript ? (
                                    <span className="text-gray-100 italic">
                                        "{interimTranscript}..."
                                    </span>
                                ) : (
                                    <span className="text-gray-400">
                                        Speak in English (formats as {activeDictationBlock ? TYPE_MAP[activeDictationBlock.type].toLowerCase() : 'text'})
                                    </span>
                                )}
                            </div>

                            {/* Stop button */}
                            <button
                                type="button"
                                onClick={stopListening}
                                className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors shrink-0"
                                title="Stop Dictation (Alt+M)"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Down Below: Live Audio Level Meter */}
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-800/80 text-[10px] font-mono">
                            <span className="text-gray-400 shrink-0 flex items-center gap-1">
                                <span className={clsx(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    audioLevel > 12 ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                                )}></span>
                                Audio Level:
                            </span>

                            {/* Dynamic volume progress track */}
                            <div className="flex-1 h-2 bg-gray-800/90 rounded-full overflow-hidden border border-gray-700/50 p-0.5">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-75",
                                        audioLevel > 60
                                            ? "bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
                                            : audioLevel > 12
                                                ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                                                : "bg-gray-600"
                                    )}
                                    style={{ width: `${Math.max(4, Math.min(100, audioLevel))}%` }}
                                />
                            </div>

                            {/* Status and Percentage Badge */}
                            <span className={clsx(
                                "shrink-0 font-bold px-1.5 py-0.5 rounded text-[9px] transition-colors",
                                audioLevel > 12
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-gray-800 text-gray-400 border border-gray-700"
                            )}>
                                {audioLevel > 12 ? `Voice Active ${audioLevel}%` : audioLevel > 0 ? `Mic ${audioLevel}%` : 'Mic Silent (0%)'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Draft Modal */}
            <CreateDraftModal
                isOpen={showCreateDraftModal}
                onClose={() => setShowCreateDraftModal(false)}
                availableScenes={availableScenes}
                currentDraftName={activeDraft?.name || 'Draft 1'}
                draftsCount={drafts.length}
                onCreateDraft={createDraft}
            />
        </div>
    );
}

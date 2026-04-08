import { type KeyboardEvent, useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { ScriptBlock, BlockType } from '../hooks/useEditor';
import { TYPE_MAP } from '../hooks/useEditor';
import { ChevronDown } from 'lucide-react';

interface BlockProps {
    block: ScriptBlock;
    onUpdate: (id: string, content: string) => void;
    onEnter: (id: string, content: string) => void;
    onBackspaceAtStart: (id: string) => void;
    onTab: (id: string) => void;
    onChangeType: (id: string, type: BlockType) => void;
    autoFocus?: boolean;
}

const ALL_TYPES: BlockType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'shot'];

export default function Block({ block, onUpdate, onEnter, onBackspaceAtStart, onTab, onChangeType, autoFocus }: BlockProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (!showTypeMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowTypeMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTypeMenu]);

    // Sync content from props to DOM, but only if they differ (prevents cursor jumping)
    useEffect(() => {
        if (ref.current && ref.current.innerText !== block.content) {
            ref.current.innerText = block.content;
        }
    }, [block.content]);

    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();

            // Special handling for Parentheticals with "()"
            if (block.type === 'parenthetical' && (block.content === '()' || block.content === '')) {
                if (block.content === '()') {
                    const range = document.createRange();
                    const textNode = ref.current.firstChild;
                    if (textNode) {
                        try {
                            range.setStart(textNode, 1);
                            range.setEnd(textNode, 1);
                            const sel = window.getSelection();
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                            return;
                        } catch (e) {
                            // fallback
                        }
                    }
                }
            }

            // Move cursor to end
            const range = document.createRange();
            range.selectNodeContents(ref.current);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [autoFocus, block.type, block.content]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(block.id, ref.current?.innerText || '');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            onTab(block.id);
        } else if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection?.anchorNode === ref.current?.firstChild || selection?.anchorNode === ref.current) {
                if (selection?.anchorOffset === 0 && selection.isCollapsed) {
                    e.preventDefault();
                    onBackspaceAtStart(block.id);
                }
            } else if (!ref.current?.innerText) {
                e.preventDefault();
                onBackspaceAtStart(block.id);
            }
        }
    };

    const handleInput = () => {
        if (ref.current) {
            let text = ref.current.innerText;

            if (block.type === 'parenthetical') {
                if (!text.startsWith('(') || !text.endsWith(')')) {
                    const clean = text.replace(/[()]/g, '');
                    const fixed = `(${clean})`;
                    if (text !== fixed) {
                        onUpdate(block.id, fixed);
                        return;
                    }
                }
            }

            onUpdate(block.id, text);
        }
    };

    // Responsive classes per type
    let responsiveClasses = '';
    if (block.type === 'scene') {
        responsiveClasses = 'ml-4 md:ml-[0.5in] max-w-full md:max-w-[6in]';
    } else if (block.type === 'action') {
        responsiveClasses = 'ml-4 md:ml-[0.5in] max-w-full md:max-w-[6in]';
    } else if (block.type === 'character') {
        responsiveClasses = 'ml-[35%] md:ml-[2.7in] w-auto text-left';
    } else if (block.type === 'dialogue') {
        responsiveClasses = 'ml-[15%] mr-[10%] md:ml-[1.5in] md:mr-[1.5in] max-w-full md:max-w-[3.5in] text-left';
    } else if (block.type === 'parenthetical') {
        responsiveClasses = 'ml-[25%] mr-[15%] md:ml-[2.1in] md:mr-[2.0in] max-w-full md:max-w-[3.0in] text-left';
    } else if (block.type === 'transition') {
        responsiveClasses = 'text-right ml-auto mr-4 md:mr-[0.5in] w-fit';
    }

    const handleBlur = () => {
        if (block.type === 'parenthetical') {
            const text = ref.current?.innerText || '';
            const clean = text.replace(/[()]/g, '').trim();
            const fixed = `(${clean})`;
            if (text !== fixed) {
                onUpdate(block.id, fixed);
            }
        }
    };

    useEffect(() => {
        if (!ref.current) return;
        if (block.type === 'parenthetical' && document.activeElement === ref.current) {
            enforceCursorGuard();
        }
    }, [block.content]);

    const enforceCursorGuard = () => {
        if (block.type !== 'parenthetical' || !ref.current) return;

        const sel = window.getSelection();
        if (!sel?.rangeCount) return;

        const rawLen = ref.current.innerText.length;
        if (rawLen < 2) return;

        let targetNode = sel.anchorNode;
        let targetOffset = sel.anchorOffset;

        if (targetNode === ref.current) {
            const textNode = ref.current.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                targetNode = textNode;
                targetOffset = (targetOffset > 0) ? textNode.textContent?.length || 0 : 0;
            }
        }

        if (targetNode && targetNode.nodeType === Node.TEXT_NODE && targetNode.parentElement === ref.current) {
            const textLen = targetNode.textContent?.length || 0;
            let newOffset = targetOffset;
            if (newOffset < 1) newOffset = 1;
            if (newOffset >= textLen) newOffset = textLen - 1;

            if (newOffset !== targetOffset) {
                const range = document.createRange();
                range.setStart(targetNode, newOffset);
                range.setEnd(targetNode, newOffset);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    };

    const handleSelectType = (type: BlockType) => {
        onChangeType(block.id, type);
        setShowTypeMenu(false);
        // Refocus the content area after selecting type
        setTimeout(() => ref.current?.focus(), 50);
    };

    // Color coding for the type badge
    const typeColor: Record<BlockType, string> = {
        scene: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        action: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        character: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        dialogue: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
        parenthetical: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        transition: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        shot: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    };

    return (
        <div className="group relative flex items-start gap-0">
            {/* Type Selector Badge */}
            <div className="relative shrink-0" ref={menuRef}>
                <button
                    type="button"
                    onClick={() => setShowTypeMenu(prev => !prev)}
                    className={clsx(
                        'flex items-center gap-0.5 rounded border text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 mt-[3px] cursor-pointer select-none transition-all duration-150 whitespace-nowrap',
                        'opacity-40 group-hover:opacity-100 focus:opacity-100',
                        typeColor[block.type]
                    )}
                    title="Change block type"
                >
                    <span className="hidden sm:inline">{TYPE_MAP[block.type]}</span>
                    <span className="sm:hidden">{block.type.slice(0, 3).toUpperCase()}</span>
                    <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showTypeMenu && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
                        {ALL_TYPES.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => handleSelectType(t)}
                                className={clsx(
                                    'w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors',
                                    t === block.type
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                )}
                            >
                                <span className={clsx(
                                    'w-2 h-2 rounded-full shrink-0',
                                    t === block.type ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                                )} />
                                {TYPE_MAP[t]}
                                {t === block.type && (
                                    <span className="ml-auto text-[10px] text-indigo-400">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Editable Area */}
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                className={clsx(
                    'outline-none flex-1',
                    responsiveClasses,
                    block.type === 'scene' ? 'uppercase font-bold mt-4 mb-2' : '',
                    block.type === 'action' ? 'mb-2' : '',
                    block.type === 'character' ? 'uppercase mt-4 mb-0' : '',
                    block.type === 'dialogue' ? 'mb-2' : '',
                    block.type === 'parenthetical' ? 'mb-0 lowercase' : '',
                    block.type === 'transition' ? 'uppercase mt-4 mb-2' : ''
                )}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onBlur={handleBlur}
                onKeyUp={enforceCursorGuard}
                onClick={enforceCursorGuard}
                data-placeholder={block.content === '' ? block.type.toUpperCase() : ''}
            />
        </div>
    );
}

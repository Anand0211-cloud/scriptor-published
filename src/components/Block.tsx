import { type KeyboardEvent, useRef, useEffect, useState, useMemo } from 'react';
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
    onFocused?: () => void;
    characterNames?: string[];
}

const ALL_TYPES: BlockType[] = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'shot'];

export default function Block({ block, onUpdate, onEnter, onBackspaceAtStart, onTab, onChangeType, autoFocus, onFocused, characterNames = [] }: BlockProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    // Track whether the latest content change came from local user typing
    const isLocalEdit = useRef(false);

    // Character autocomplete state
    const [showAutoComplete, setShowAutoComplete] = useState(false);
    const [acSelectedIndex, setAcSelectedIndex] = useState(0);
    const acRef = useRef<HTMLDivElement>(null);

    // Filter character suggestions based on current typed text
    const acSuggestions = useMemo(() => {
        if (block.type !== 'character' || !block.content.trim()) return [];
        const typed = block.content.trim().toUpperCase();
        return characterNames
            .filter(name => name.toUpperCase().startsWith(typed) && name.toUpperCase() !== typed)
            .slice(0, 5);
    }, [block.type, block.content, characterNames]);

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

    // Sync content from props to DOM ONLY for external/programmatic changes.
    // Skip when the change originated from local typing to preserve cursor position.
    useEffect(() => {
        if (isLocalEdit.current) {
            isLocalEdit.current = false;
            return;
        }
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
                            // Signal that focus has been consumed
                            onFocused?.();
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

            // Signal that focus has been consumed so focusedId resets
            onFocused?.();
        }
    }, [autoFocus, block.type, block.content, onFocused]);

    const handleKeyDown = (e: KeyboardEvent) => {
        // Character autocomplete keyboard navigation
        if (showAutoComplete && acSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setAcSelectedIndex(prev => (prev + 1) % acSuggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setAcSelectedIndex(prev => (prev - 1 + acSuggestions.length) % acSuggestions.length);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = acSuggestions[acSelectedIndex];
                if (selected) {
                    isLocalEdit.current = false; // Allow sync to update DOM
                    onUpdate(block.id, selected);
                    setShowAutoComplete(false);
                    // Set cursor to end after name fills
                    requestAnimationFrame(() => {
                        if (ref.current) {
                            ref.current.innerText = selected;
                            const range = document.createRange();
                            range.selectNodeContents(ref.current);
                            range.collapse(false);
                            const sel = window.getSelection();
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    });
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowAutoComplete(false);
                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            setShowAutoComplete(false);
            onEnter(block.id, ref.current?.innerText || '');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            setShowAutoComplete(false);
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
            // Mark this as a local edit so the sync effect won't clobber the DOM
            isLocalEdit.current = true;

            if (block.type === 'parenthetical') {
                if (!text.startsWith('(') || !text.endsWith(')')) {
                    const clean = text.replace(/[()]/g, '');
                    const fixed = `(${clean})`;
                    if (text !== fixed) {
                        // For parenthetical fixes we DO need to rewrite DOM, so save & restore cursor
                        const sel = window.getSelection();
                        const cursorOffset = sel?.anchorOffset ?? 0;
                        onUpdate(block.id, fixed);
                        // Restore cursor after React re-render
                        requestAnimationFrame(() => {
                            if (!ref.current) return;
                            const textNode = ref.current.firstChild;
                            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                                const safeOffset = Math.min(cursorOffset + 1, (textNode.textContent?.length ?? 1) - 1);
                                const range = document.createRange();
                                range.setStart(textNode, Math.max(1, safeOffset));
                                range.setEnd(textNode, Math.max(1, safeOffset));
                                sel?.removeAllRanges();
                                sel?.addRange(range);
                            }
                        });
                        return;
                    }
                }
            }

            onUpdate(block.id, text);

            // Show autocomplete for character blocks
            if (block.type === 'character' && text.trim().length > 0) {
                setShowAutoComplete(true);
                setAcSelectedIndex(0);
            } else {
                setShowAutoComplete(false);
            }
        }
    };

    // Industry-standard screenplay formatting margins
    // Page: 8.5in, padding: 1.5in left + 1.0in right = 6.0in writing area.
    // All margins below are relative to the writing area edges.
    // Scene / Action / Shot: full width (left-aligned, spans 6.0in)
    // Character: ~2.2in from writing-area left (= 3.7in from page edge)
    // Dialogue: ~1.0in from left, ~0.5in from right (= ~4.5in wide)
    // Parenthetical: ~1.6in from left, ~1.0in from right (= ~3.4in wide)
    // Transition: right-aligned with small right margin
    let responsiveClasses = '';
    if (block.type === 'scene') {
        responsiveClasses = 'max-w-full';
    } else if (block.type === 'action') {
        responsiveClasses = 'max-w-full';
    } else if (block.type === 'shot') {
        responsiveClasses = 'max-w-full';
    } else if (block.type === 'character') {
        responsiveClasses = 'ml-[35%] md:ml-[2.2in] w-auto text-left';
    } else if (block.type === 'dialogue') {
        responsiveClasses = 'ml-[15%] mr-[10%] md:ml-[1.0in] md:mr-[0.5in] max-w-full md:max-w-[4.5in] text-left';
    } else if (block.type === 'parenthetical') {
        responsiveClasses = 'ml-[25%] mr-[15%] md:ml-[1.6in] md:mr-[1.0in] max-w-full md:max-w-[3.4in] text-left';
    } else if (block.type === 'transition') {
        responsiveClasses = 'text-right ml-auto mr-2 md:mr-0 w-fit';
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

    // Industry-standard solid colors — high contrast, white text, always readable
    const typeColor: Record<BlockType, string> = {
        scene:         'bg-amber-600 text-white border-amber-700',
        action:        'bg-slate-600 text-white border-slate-700',
        character:     'bg-violet-600 text-white border-violet-700',
        dialogue:      'bg-emerald-600 text-white border-emerald-700',
        parenthetical: 'bg-cyan-600 text-white border-cyan-700',
        transition:    'bg-rose-600 text-white border-rose-700',
        shot:          'bg-orange-600 text-white border-orange-700',
    };

    // Handle clicking a suggestion from the autocomplete dropdown
    const handleAcSelect = (name: string) => {
        isLocalEdit.current = false;
        onUpdate(block.id, name);
        setShowAutoComplete(false);
        requestAnimationFrame(() => {
            if (ref.current) {
                ref.current.innerText = name;
                ref.current.focus();
                const range = document.createRange();
                range.selectNodeContents(ref.current);
                range.collapse(false);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        });
    };

    return (
        <div className="group relative" data-block-id={block.id}>
            {/* Type Selector Badge — absolutely positioned OUTSIDE the content flow */}
            <div className="absolute right-full mr-2 top-0 z-30" ref={menuRef}
                 style={{ marginTop: (block.type === 'scene' || block.type === 'character' || block.type === 'transition' || block.type === 'shot') ? '1rem' : '0' }}
            >
                <button
                    type="button"
                    onClick={() => setShowTypeMenu(prev => !prev)}
                    className={clsx(
                        'flex items-center gap-1 rounded-md border text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 cursor-pointer select-none transition-all duration-150 whitespace-nowrap shadow-sm',
                        'opacity-0 group-hover:opacity-100 focus:opacity-100',
                        typeColor[block.type]
                    )}
                    title="Change block type"
                >
                    <span className="hidden md:inline">{TYPE_MAP[block.type]}</span>
                    <span className="md:hidden">{block.type.slice(0, 3).toUpperCase()}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                </button>

                {/* Dropdown Menu */}
                {showTypeMenu && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-1.5 min-w-[180px]">
                        {ALL_TYPES.map(t => {
                            const dotColor: Record<BlockType, string> = {
                                scene: 'bg-amber-600',
                                action: 'bg-slate-600',
                                character: 'bg-violet-600',
                                dialogue: 'bg-emerald-600',
                                parenthetical: 'bg-cyan-600',
                                transition: 'bg-rose-600',
                                shot: 'bg-orange-600',
                            };
                            const isActive = t === block.type;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleSelectType(t)}
                                    className={clsx(
                                        'w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer',
                                        isActive
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                                    )}
                                >
                                    <span className={clsx(
                                        'w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900',
                                        dotColor[t],
                                        isActive ? 'ring-current' : 'ring-transparent'
                                    )} />
                                    {TYPE_MAP[t]}
                                    {isActive && (
                                        <span className="ml-auto text-[11px] font-bold text-indigo-500 dark:text-indigo-400">✓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Content Editable Area — margins measured from page edge, no badge interference */}
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                className={clsx(
                    'outline-none w-full',
                    responsiveClasses,
                    block.type === 'scene' ? 'uppercase font-bold mt-4 mb-2' : '',
                    block.type === 'action' ? 'mb-2' : '',
                    block.type === 'shot' ? 'uppercase font-bold mt-2 mb-2' : '',
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

            {/* Character Autocomplete Dropdown */}
            {block.type === 'character' && showAutoComplete && acSuggestions.length > 0 && (
                <div
                    ref={acRef}
                    className="absolute z-50 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px]"
                    style={{ left: '2.2in' }}
                >
                    {acSuggestions.map((name, i) => (
                        <button
                            key={name}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleAcSelect(name); }}
                            className={clsx(
                                'w-full text-left px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wide flex items-center gap-2 transition-colors cursor-pointer',
                                i === acSelectedIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            )}
                        >
                            <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {name.charAt(0)}
                            </span>
                            {name}
                        </button>
                    ))}
                    <div className="px-3 py-1 border-t border-gray-100 dark:border-gray-800 mt-1">
                        <span className="text-[9px] text-gray-400">↑↓ navigate · Enter select · Esc close</span>
                    </div>
                </div>
            )}
        </div>
    );
}

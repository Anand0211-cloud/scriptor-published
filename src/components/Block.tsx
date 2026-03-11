import { type KeyboardEvent, useRef, useEffect } from 'react';
import clsx from 'clsx';
import type { ScriptBlock } from '../hooks/useEditor';

interface BlockProps {
    block: ScriptBlock;
    onUpdate: (id: string, content: string) => void;
    onEnter: (id: string, content: string) => void;
    onBackspaceAtStart: (id: string) => void;
    onTab: (id: string) => void;
    autoFocus?: boolean;
}

export default function Block({ block, onUpdate, onEnter, onBackspaceAtStart, onTab, autoFocus }: BlockProps) {
    const ref = useRef<HTMLDivElement>(null);

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
                // If empty, set content to '()' via timer to avoid conflict? 
                // No, content is synced via props. 
                // If content is '()', put cursor inside.
                if (block.content === '()') {
                    const range = document.createRange();
                    const textNode = ref.current.firstChild;
                    if (textNode) {
                        try {
                            range.setStart(textNode, 1); // Inside the "("
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
    }, [autoFocus, block.type, block.content]); // Added dependencies

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(block.id, ref.current?.innerText || '');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            onTab(block.id);
        } else if (e.key === 'Backspace') {
            const selection = window.getSelection();
            // Check if cursor is at start (collapsed selection at offset 0)
            if (selection?.anchorNode === ref.current?.firstChild || selection?.anchorNode === ref.current) {
                if (selection?.anchorOffset === 0 && selection.isCollapsed) {
                    e.preventDefault();
                    onBackspaceAtStart(block.id);
                }
            } else if (!ref.current?.innerText) {
                // Empty block case
                e.preventDefault();
                onBackspaceAtStart(block.id);
            }
        }
    };

    const handleInput = () => {
        if (ref.current) {
            let text = ref.current.innerText;

            // Enforce Parenthetical Format (content) on input
            if (block.type === 'parenthetical') {
                // If the user managed to delete a paren or type outside, fix it immediately for the state
                // But for the DOM, it might be jarring if we force update on every keystroke if it moves cursor.
                // However, the request is "while writing... words go outside... fix this".

                // Check if it starts/ends with parens
                if (!text.startsWith('(') || !text.endsWith(')')) {
                    // Try to preserve internal content
                    const clean = text.replace(/[()]/g, '');
                    // This is aggressive, but effective. 
                    // To avoid cursor jumping we might need to be careful, but component syncs on props change.
                    // If we update prop, it re-renders.

                    // Let's rely on the effect hook to fix the DOM if we change the state "correctly".
                    // But we need to update the state with the fixed version.

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

    // Industry Standard Margins (assuming container has 1in padding)
    // Page width: 8.5in. Content width: 6.5in.
    // Base Left Margin: 1.5in (so +0.5in relative to container)

    // Action: Full width (1.5in margin)
    // Character: 3.7in from left -> +2.7in relative to container (margin 1in) ?? 
    // Wait, container padding is 1in. So 0in = 1in on page.
    // Action: 1.5in on page = 0.5in indent.
    // Character: 3.7in on page = 2.7in indent.
    // Dialogue: 2.5in on page = 1.5in indent. Width ~3.5in.
    // Parenthetical: 3.1in on page = 2.1in indent.

    const styles: React.CSSProperties = {};

    // Base indent for everything to hitting 1.5in left margin
    // But our container has p-[1in], so we add 0.5in to everything?
    // Let's assume the user wants the "look" relative to the "page" div.

    if (block.type === 'scene') {
        styles.marginLeft = '0.5in'; // 1.5in total
        styles.maxWidth = '6in';
    }
    else if (block.type === 'action') {
        styles.marginLeft = '0.5in'; // 1.5in total
        styles.maxWidth = '6in';
    }
    else if (block.type === 'character') {
        styles.marginLeft = '2.7in'; // 3.7in total
        styles.width = 'auto'; // let it grow
        styles.textAlign = 'left';
    }
    else if (block.type === 'dialogue') {
        styles.marginLeft = '1.5in'; // 2.5in total
        styles.marginRight = '1.5in'; // Limit width
        styles.maxWidth = '3.5in';
        styles.textAlign = 'left';
    }
    else if (block.type === 'parenthetical') {
        styles.marginLeft = '2.1in'; // 3.1in total
        styles.marginRight = '2.0in';
        styles.maxWidth = '3.0in';
        styles.textAlign = 'left';
    }
    else if (block.type === 'transition') {
        styles.textAlign = 'right';
        styles.marginLeft = 'auto'; // Force to right
        styles.marginRight = '0.5in';
        styles.width = 'fit-content'; // Ensure it only takes needed space so cursor stays right? 
        // actually for contentEditable with text-align right, display block is fine. 
        // But let's try pushing it to the right with margin-left auto.
    }

    const handleBlur = () => {
        // Sanitize on blur
        if (block.type === 'parenthetical') {
            const text = ref.current?.innerText || '';
            const clean = text.replace(/[()]/g, '').trim();
            const fixed = `(${clean})`;
            if (text !== fixed) {
                onUpdate(block.id, fixed);
            }
        }
    };

    // Use LayoutEffect for cursor positioning to avoid visual jumping
    // We need to run this when block.content changes if we are focused
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
        // Minimum length should be 2 for "()"
        if (rawLen < 2) return;

        let targetNode = sel.anchorNode;
        let targetOffset = sel.anchorOffset;

        // Normalize selection: If selected node is the DIV, get the text node inside
        if (targetNode === ref.current) {
            // If offset is 0, it means before first child.
            // If offset is 1, it means after first child (assuming single text node).
            const textNode = ref.current.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                targetNode = textNode;
                // If invalid div offset, map to end of text
                targetOffset = (targetOffset > 0) ? textNode.textContent?.length || 0 : 0;
            }
        }

        // Now strictly check if we are in the text node
        if (targetNode && targetNode.nodeType === Node.TEXT_NODE && targetNode.parentElement === ref.current) {
            const textLen = targetNode.textContent?.length || 0;
            let newOffset = targetOffset;

            // Must be > 0 (after '(')
            if (newOffset < 1) newOffset = 1;

            // Must be < len (before ')')
            // If cursor is AT len, it is AFTER the last character (the closing paren)
            // We want max index to be len - 1
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

    return (
        <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            className={clsx(
                'outline-none',
                block.type === 'scene' ? 'uppercase font-bold mt-4 mb-2' : '',
                block.type === 'action' ? 'mb-2' : '',
                block.type === 'character' ? 'uppercase mt-4 mb-0' : '',
                block.type === 'dialogue' ? 'mb-2' : '',
                block.type === 'parenthetical' ? 'mb-0 lowercase' : '', // Parentheticals are lowercase
                block.type === 'transition' ? 'uppercase mt-4 mb-2' : ''
            )}
            style={styles}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onBlur={handleBlur}
            onKeyUp={enforceCursorGuard}
            onClick={enforceCursorGuard}
            data-placeholder={block.content === '' ? block.type.toUpperCase() : ''}
        />
    );
}

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

export type BlockType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot';

export interface ScriptBlock {
    id: string;
    type: BlockType;
    content: string;
}

// Industry standard formatting rules
export const TYPE_MAP: Record<BlockType, string> = {
    scene: 'SCENE HEADING',
    action: 'ACTION',
    character: 'CHARACTER',
    dialogue: 'DIALOGUE',
    parenthetical: 'PARENTHETICAL',
    transition: 'TRANSITION',
    shot: 'SHOT'
};

// Next block type logic (Standard Screenplay Rules)
const NEXT_TYPE: Record<BlockType, BlockType> = {
    scene: 'action',
    action: 'action',
    character: 'dialogue',
    dialogue: 'character', // Usually alternates, but could be action
    parenthetical: 'dialogue',
    transition: 'scene',
    shot: 'action'
};

export function useEditor(scriptId?: string) {
    const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
    const [title, setTitle] = useState('Untitled Screenplay');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    // Stabilize the user identity so the load effect doesn't re-run
    // every time Supabase refreshes the JWT token (e.g. on tab switch).
    const userIdRef = useRef(user?.id);
    userIdRef.current = user?.id;
    const stableUserId = useMemo(() => user?.id, [user?.id]);

    // Track focused block to ensure focus persistence after renders
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [autofocusId, setAutofocusId] = useState<string | null>(null);

    // Refs for autosave tracking
    const initialLoadDone = useRef(false);
    const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch script on load
    useEffect(() => {
        if (!scriptId || !stableUserId) return;

        const loadScript = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('scripts')
                .select('title, content')
                .eq('id', scriptId)
                .single();

            if (error) {
                console.error("Error loading script", error);
            } else if (data) {
                setTitle(data.title);

                // Parse blocks, if empty (or null), initialize with a default scene and action
                let loadedBlocks = [];
                try {
                    loadedBlocks = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                } catch (e) {
                    console.error("Error parsing script content", e);
                }

                if (!Array.isArray(loadedBlocks) || loadedBlocks.length === 0) {
                    loadedBlocks = [
                        { id: uuidv4(), type: 'scene', content: 'INT. OFFICE - DAY' },
                        { id: uuidv4(), type: 'action', content: 'The room is silent.' }
                    ];
                }

                setBlocks(loadedBlocks);
            }
            setLoading(false);

            // Mark load as done so autosave can kick in on subsequent changes
            setTimeout(() => {
                initialLoadDone.current = true;
            }, 500);
        };

        loadScript();

        return () => {
            // cleanup
            initialLoadDone.current = false;
            if (pendingSave.current) clearTimeout(pendingSave.current);
        }
    }, [scriptId, stableUserId]);
    const saveScript = useCallback(async () => {
        if (!scriptId || !user) return;
        setSaving(true);

        const { error } = await supabase
            .from('scripts')
            .update({
                title: title,
                content: blocks
            })
            .eq('id', scriptId);

        if (error) {
            console.error("Failed to save script:", error);
        }

        setSaving(false);
    }, [scriptId, user, title, blocks]);

    // Autosave Effect
    useEffect(() => {
        if (!initialLoadDone.current || loading) return;

        setSaving(true); // Show preparing to save indicator immediately for feedback

        if (pendingSave.current) {
            clearTimeout(pendingSave.current);
        }

        pendingSave.current = setTimeout(() => {
            saveScript();
        }, 2000);

        return () => {
            if (pendingSave.current) {
                clearTimeout(pendingSave.current);
            }
        };
    }, [blocks, title, saveScript, loading]);

    const updateBlock = useCallback((id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    }, []);

    const addBlock = useCallback((afterId: string, type: BlockType = 'action') => {
        const newBlock: ScriptBlock = { id: uuidv4(), type, content: '' };
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === afterId);
            if (index === -1) return prev;
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });
        setFocusedId(newBlock.id);
        setAutofocusId(newBlock.id);
    }, []);

    const changeType = useCallback((id: string, type: BlockType) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, type } : b));
    }, []);

    const deleteBlock = useCallback((id: string) => {
        // Read current blocks to find the previous block's ID before mutating
        let prevBlockId: string | null = null;
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index <= 0) return prev; // Don't delete the first block for now

            prevBlockId = prev[index - 1].id;
            const newBlocks = [...prev];
            newBlocks.splice(index, 1);
            return newBlocks;
        });
        // Focus the previous block AFTER setBlocks, not inside the updater
        if (prevBlockId) {
            setFocusedId(prevBlockId);
            setAutofocusId(prevBlockId);
        }
    }, []);

    // Handle "Enter" key
    const handleEnter = useCallback((id: string, content: string) => {
        // Generate the new block ID before the updater so we can focus it afterwards
        const newId = uuidv4();
        setBlocks(prev => {
            const currentBlock = prev.find(b => b.id === id);
            if (!currentBlock) return prev;

            let nextType = NEXT_TYPE[currentBlock.type];

            // Special case: If Enter is pressed on an empty Character block, switch it to Action
            if (currentBlock.type === 'character' && content.trim() === '') {
                // Note: This needs to be handled carefully, for now just create next
            }

            const newBlock: ScriptBlock = { id: newId, type: nextType, content: '' };
            const index = prev.findIndex(b => b.id === id);
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });
        // Focus the new block AFTER setBlocks
        setFocusedId(newId);
        setAutofocusId(newId);
    }, []);

    // Handle "Backspace" key at start of block
    const handleBackspaceAtStart = useCallback((id: string) => {
        let targetId: string | null = null;
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index <= 0) return prev;

            const currentBlock = prev[index];
            const prevBlock = prev[index - 1];
            targetId = prevBlock.id;

            const newBlocks = [...prev];
            // Merge content if previous block exists
            const mergedContent = prevBlock.content + (prevBlock.content && currentBlock.content ? ' ' : '') + currentBlock.content;

            newBlocks[index - 1] = { ...prevBlock, content: mergedContent };
            newBlocks.splice(index, 1);
            return newBlocks;
        });
        // Focus the target block AFTER setBlocks
        if (targetId) {
            setFocusedId(targetId);
            setAutofocusId(targetId);
        }
    }, []);

    // Handle "Tab" key to cycle types
    const handleTab = useCallback((id: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== id) return b;

            let nextType: BlockType = 'action';
            let nextContent = b.content;

            switch (b.type) {
                case 'scene': nextType = 'action'; break;
                case 'action': nextType = 'character'; break;
                case 'character': nextType = 'transition'; break;
                case 'transition': nextType = 'scene'; break;
                case 'dialogue': nextType = 'parenthetical'; break;
                case 'parenthetical': nextType = 'dialogue'; break;
                default: nextType = 'action';
            }

            // Auto-add parentheses if missing
            if (nextType === 'parenthetical') {
                if (!nextContent.startsWith('(')) nextContent = '(' + nextContent;
                if (!nextContent.endsWith(')')) nextContent = nextContent + ')';
            }

            return { ...b, type: nextType, content: nextContent };
        }));
    }, []);

    // Auto-save effect logic (optional, for explicit save simply export saveScript)
    // Debouncer could be added here if desired

    return {
        blocks,
        title,
        loading,
        saving,
        setTitle,
        saveScript,
        updateBlock,
        addBlock,
        deleteBlock,
        changeType,
        handleEnter,
        handleBackspaceAtStart,
        handleTab,
        focusedId,
        setFocusedId,
        autofocusId,
        setAutofocusId
    };
}

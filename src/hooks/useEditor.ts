import { useState, useCallback, useEffect, useRef } from 'react';
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

    // Track focused block to ensure focus persistence after renders
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // Refs for autosave tracking
    const initialLoadDone = useRef(false);
    const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch script on load
    useEffect(() => {
        if (!scriptId || !user) return;

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
    }, [scriptId, user]);
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
    }, []);

    const changeType = useCallback((id: string, type: BlockType) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, type } : b));
    }, []);

    const deleteBlock = useCallback((id: string) => {
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index <= 0) return prev; // Don't delete the first block for now

            const newBlocks = [...prev];
            newBlocks.splice(index, 1);

            // Focus the previous block
            setFocusedId(prev[index - 1].id);
            return newBlocks;
        });
    }, []);

    // Handle "Enter" key
    const handleEnter = useCallback((id: string, content: string) => {
        // Find current block to determine next type
        setBlocks(prev => {
            const currentBlock = prev.find(b => b.id === id);
            if (!currentBlock) return prev;

            let nextType = NEXT_TYPE[currentBlock.type];

            // Special case: If Enter is pressed on an empty Character block, switch it to Action
            if (currentBlock.type === 'character' && content.trim() === '') {
                // Note: This needs to be handled carefully, for now just create next
            }

            const newBlock: ScriptBlock = { id: uuidv4(), type: nextType, content: '' };
            const index = prev.findIndex(b => b.id === id);
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);

            setFocusedId(newBlock.id);
            return newBlocks;
        });
    }, []);

    // Handle "Backspace" key at start of block
    const handleBackspaceAtStart = useCallback((id: string) => {
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index <= 0) return prev;

            const currentBlock = prev[index];
            const prevBlock = prev[index - 1];

            const newBlocks = [...prev];
            // Merge content if previous block exists
            const mergedContent = prevBlock.content + (prevBlock.content && currentBlock.content ? ' ' : '') + currentBlock.content;

            newBlocks[index - 1] = { ...prevBlock, content: mergedContent };
            newBlocks.splice(index, 1);

            setFocusedId(prevBlock.id);
            return newBlocks;
        });
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
        setFocusedId
    };
}

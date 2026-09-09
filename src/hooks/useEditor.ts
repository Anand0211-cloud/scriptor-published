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

export interface ScriptDraft {
    id: string;
    name: string;
    createdAt: string;
    lastModified: string;
    blocks: ScriptBlock[];
}

export interface ScriptSceneInfo {
    id: string; // The block ID of the scene heading
    sceneNumber: number;
    heading: string;
    preview: string;
    blockCount: number;
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
    dialogue: 'character',
    parenthetical: 'dialogue',
    transition: 'scene',
    shot: 'action'
};

const DEFAULT_INITIAL_BLOCKS: ScriptBlock[] = [
    { id: uuidv4(), type: 'scene', content: 'INT. OFFICE - DAY' },
    { id: uuidv4(), type: 'action', content: 'The room is silent.' }
];

export function useEditor(scriptId?: string) {
    const [drafts, setDrafts] = useState<ScriptDraft[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string>('');
    const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
    const [title, setTitle] = useState('Untitled Screenplay');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    // Stabilize user identity
    const stableUserId = useMemo(() => user?.id, [user?.id]);

    // Focus tracking
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [autofocusId, setAutofocusId] = useState<string | null>(null);

    // Autosave tracking refs
    const initialLoadDone = useRef(false);
    const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep active draft blocks in sync with `blocks` in ref for instant switches
    const blocksRef = useRef(blocks);
    blocksRef.current = blocks;

    const draftsRef = useRef(drafts);
    draftsRef.current = drafts;

    const activeDraftIdRef = useRef(activeDraftId);
    activeDraftIdRef.current = activeDraftId;

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
                setTitle(data.title || 'Untitled Screenplay');

                let parsedContent: any = null;
                try {
                    parsedContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                } catch (e) {
                    console.error("Error parsing script content", e);
                }

                let loadedDrafts: ScriptDraft[] = [];
                let initialActiveId = '';

                // Check if content is structured as Drafts (version 2) or legacy raw blocks array
                if (parsedContent && typeof parsedContent === 'object' && !Array.isArray(parsedContent) && Array.isArray(parsedContent.drafts)) {
                    loadedDrafts = parsedContent.drafts;
                    initialActiveId = parsedContent.activeDraftId || loadedDrafts[0]?.id || '';
                } else {
                    // Legacy payload (array of blocks or empty)
                    let rawBlocks: ScriptBlock[] = Array.isArray(parsedContent) && parsedContent.length > 0
                        ? parsedContent
                        : DEFAULT_INITIAL_BLOCKS;

                    const defaultDraftId = uuidv4();
                    loadedDrafts = [
                        {
                            id: defaultDraftId,
                            name: 'Draft 1 (First Draft)',
                            createdAt: new Date().toISOString(),
                            lastModified: new Date().toISOString(),
                            blocks: rawBlocks
                        }
                    ];
                    initialActiveId = defaultDraftId;
                }

                if (loadedDrafts.length === 0) {
                    const defaultDraftId = uuidv4();
                    loadedDrafts = [
                        {
                            id: defaultDraftId,
                            name: 'Draft 1',
                            createdAt: new Date().toISOString(),
                            lastModified: new Date().toISOString(),
                            blocks: DEFAULT_INITIAL_BLOCKS
                        }
                    ];
                    initialActiveId = defaultDraftId;
                }

                const currentActiveDraft = loadedDrafts.find(d => d.id === initialActiveId) || loadedDrafts[0];

                setDrafts(loadedDrafts);
                setActiveDraftId(currentActiveDraft.id);
                setBlocks(currentActiveDraft.blocks || DEFAULT_INITIAL_BLOCKS);
            }
            setLoading(false);

            setTimeout(() => {
                initialLoadDone.current = true;
            }, 400);
        };

        loadScript();

        return () => {
            initialLoadDone.current = false;
            if (pendingSave.current) clearTimeout(pendingSave.current);
        };
    }, [scriptId, stableUserId]);

    // Save script to Supabase (saves active draft + all drafts structure)
    const saveScript = useCallback(async () => {
        if (!scriptId || !user) return;
        setSaving(true);

        const currentActiveId = activeDraftIdRef.current;
        const currentBlocks = blocksRef.current;

        // Update active draft's blocks & timestamp in draft list
        const updatedDrafts = draftsRef.current.map(d => {
            if (d.id === currentActiveId) {
                return {
                    ...d,
                    blocks: currentBlocks,
                    lastModified: new Date().toISOString()
                };
            }
            return d;
        });

        const payload = {
            version: 2,
            activeDraftId: currentActiveId,
            drafts: updatedDrafts
        };

        const { error } = await supabase
            .from('scripts')
            .update({
                title: title,
                content: payload
            })
            .eq('id', scriptId);

        if (error) {
            console.error("Failed to save script:", error);
        } else {
            setDrafts(updatedDrafts);
        }

        setSaving(false);
    }, [scriptId, user, title]);

    // Autosave Effect
    useEffect(() => {
        if (!initialLoadDone.current || loading) return;

        setSaving(true);

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
    }, [blocks, title, activeDraftId, saveScript, loading]);

    // Active draft computed object
    const activeDraft = useMemo(() => {
        return drafts.find(d => d.id === activeDraftId) || drafts[0];
    }, [drafts, activeDraftId]);

    // Extract scenes from current blocks for navigator and scene picker
    const availableScenes: ScriptSceneInfo[] = useMemo(() => {
        const scenes: ScriptSceneInfo[] = [];
        let currentScene: ScriptSceneInfo | null = null;
        let sceneCount = 0;

        blocks.forEach((block) => {
            if (block.type === 'scene') {
                sceneCount++;
                currentScene = {
                    id: block.id,
                    sceneNumber: sceneCount,
                    heading: block.content.trim() || 'UNTITLED SCENE',
                    preview: '',
                    blockCount: 1
                };
                scenes.push(currentScene);
            } else if (currentScene) {
                currentScene.blockCount++;
                if (!currentScene.preview && block.content.trim()) {
                    currentScene.preview = block.content.trim().slice(0, 80);
                }
            }
        });

        return scenes;
    }, [blocks]);

    // Switch between drafts
    const switchDraft = useCallback((targetDraftId: string) => {
        if (targetDraftId === activeDraftIdRef.current) return;

        // 1. Snapshot current active draft blocks
        const currentActiveId = activeDraftIdRef.current;
        const currentBlocks = blocksRef.current;

        const updatedDrafts = draftsRef.current.map(d => {
            if (d.id === currentActiveId) {
                return { ...d, blocks: currentBlocks, lastModified: new Date().toISOString() };
            }
            return d;
        });

        const targetDraft = updatedDrafts.find(d => d.id === targetDraftId);
        if (!targetDraft) return;

        setDrafts(updatedDrafts);
        setActiveDraftId(targetDraftId);
        setBlocks(targetDraft.blocks || DEFAULT_INITIAL_BLOCKS);
        setFocusedId(null);
        setAutofocusId(null);

        // Immediate persist
        if (scriptId && user) {
            const payload = {
                version: 2,
                activeDraftId: targetDraftId,
                drafts: updatedDrafts
            };
            supabase.from('scripts').update({ content: payload }).eq('id', scriptId);
        }
    }, [scriptId, user]);

    // Create a new draft with options (copy all, choose scenes, or blank)
    const createDraft = useCallback((options: {
        name: string;
        copyMode: 'all' | 'scenes' | 'blank';
        selectedSceneIds?: string[];
    }) => {
        const newDraftId = uuidv4();
        let newBlocks: ScriptBlock[] = [];

        if (options.copyMode === 'all') {
            // Full clone with fresh block IDs
            newBlocks = blocksRef.current.map(b => ({
                id: uuidv4(),
                type: b.type,
                content: b.content
            }));
        } else if (options.copyMode === 'scenes' && options.selectedSceneIds && options.selectedSceneIds.length > 0) {
            // Copy only blocks belonging to selected scenes
            const selectedSet = new Set(options.selectedSceneIds);
            let isCurrentSceneSelected = false;

            blocksRef.current.forEach(block => {
                if (block.type === 'scene') {
                    isCurrentSceneSelected = selectedSet.has(block.id);
                }
                if (isCurrentSceneSelected) {
                    newBlocks.push({
                        id: uuidv4(),
                        type: block.type,
                        content: block.content
                    });
                }
            });

            if (newBlocks.length === 0) {
                newBlocks = [
                    { id: uuidv4(), type: 'scene', content: 'INT. NEW SCENE - DAY' },
                    { id: uuidv4(), type: 'action', content: '' }
                ];
            }
        } else {
            // Blank draft
            newBlocks = [
                { id: uuidv4(), type: 'scene', content: 'INT. SCENE 1 - DAY' },
                { id: uuidv4(), type: 'action', content: '' }
            ];
        }

        // Save current active draft state first
        const currentActiveId = activeDraftIdRef.current;
        const currentBlocks = blocksRef.current;

        const newDraft: ScriptDraft = {
            id: newDraftId,
            name: options.name.trim() || `Draft ${draftsRef.current.length + 1}`,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            blocks: newBlocks
        };

        const updatedDrafts = [
            ...draftsRef.current.map(d => (d.id === currentActiveId ? { ...d, blocks: currentBlocks, lastModified: new Date().toISOString() } : d)),
            newDraft
        ];

        setDrafts(updatedDrafts);
        setActiveDraftId(newDraftId);
        setBlocks(newBlocks);
        setFocusedId(null);
        setAutofocusId(null);

        // Immediate persist
        if (scriptId && user) {
            const payload = {
                version: 2,
                activeDraftId: newDraftId,
                drafts: updatedDrafts
            };
            supabase.from('scripts').update({ content: payload }).eq('id', scriptId);
        }

        return newDraftId;
    }, [scriptId, user]);

    // Rename draft
    const renameDraft = useCallback((targetDraftId: string, newName: string) => {
        if (!newName.trim()) return;

        setDrafts(prev => {
            const next = prev.map(d => (d.id === targetDraftId ? { ...d, name: newName.trim(), lastModified: new Date().toISOString() } : d));
            draftsRef.current = next;
            return next;
        });
    }, []);

    // Duplicate draft
    const duplicateDraft = useCallback((targetDraftId: string) => {
        const sourceDraft = draftsRef.current.find(d => d.id === targetDraftId);
        if (!sourceDraft) return '';

        const newDraftId = uuidv4();
        const duplicatedBlocks = (targetDraftId === activeDraftIdRef.current ? blocksRef.current : sourceDraft.blocks).map(b => ({
            id: uuidv4(),
            type: b.type,
            content: b.content
        }));

        const newDraft: ScriptDraft = {
            id: newDraftId,
            name: `${sourceDraft.name} (Copy)`,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            blocks: duplicatedBlocks
        };

        const updatedDrafts = [...draftsRef.current, newDraft];
        setDrafts(updatedDrafts);

        return newDraftId;
    }, []);

    // Delete draft
    const deleteDraft = useCallback((targetDraftId: string) => {
        if (draftsRef.current.length <= 1) {
            alert("A screenplay must have at least one draft.");
            return false;
        }

        const remainingDrafts = draftsRef.current.filter(d => d.id !== targetDraftId);
        let nextActiveId = activeDraftIdRef.current;

        if (targetDraftId === activeDraftIdRef.current) {
            nextActiveId = remainingDrafts[0].id;
            setActiveDraftId(nextActiveId);
            setBlocks(remainingDrafts[0].blocks || DEFAULT_INITIAL_BLOCKS);
        }

        setDrafts(remainingDrafts);

        if (scriptId && user) {
            const payload = {
                version: 2,
                activeDraftId: nextActiveId,
                drafts: remainingDrafts
            };
            supabase.from('scripts').update({ content: payload }).eq('id', scriptId);
        }

        return true;
    }, [scriptId, user]);

    // Block editor modifiers
    const updateBlock = useCallback((id: string, content: string) => {
        setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content } : b)));
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
        setBlocks(prev => prev.map(b => (b.id === id ? { ...b, type } : b)));
    }, []);

    const deleteBlock = useCallback((id: string) => {
        let prevBlockId: string | null = null;
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index <= 0) return prev;

            prevBlockId = prev[index - 1].id;
            const newBlocks = [...prev];
            newBlocks.splice(index, 1);
            return newBlocks;
        });
        if (prevBlockId) {
            setFocusedId(prevBlockId);
            setAutofocusId(prevBlockId);
        }
    }, []);

    // Handle Enter key
    const handleEnter = useCallback((id: string, beforeContent: string, afterContent: string, sameType: boolean = false) => {
        const newId = uuidv4();
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index === -1) return prev;
            const currentBlock = prev[index];

            const nextType = sameType ? currentBlock.type : NEXT_TYPE[currentBlock.type];

            const newBlock: ScriptBlock = { id: newId, type: nextType, content: afterContent };
            const newBlocks = [...prev];
            newBlocks[index] = { ...currentBlock, content: beforeContent };
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });
        setFocusedId(newId);
        setAutofocusId(newId);
    }, []);

    // Handle Backspace at start of block
    const handleBackspaceAtStart = useCallback((id: string) => {
        let targetId: string | null = null;
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === id);
            if (index <= 0) return prev;

            const currentBlock = prev[index];
            const prevBlock = prev[index - 1];
            targetId = prevBlock.id;

            const newBlocks = [...prev];
            const mergedContent = prevBlock.content + (prevBlock.content && currentBlock.content ? ' ' : '') + currentBlock.content;

            newBlocks[index - 1] = { ...prevBlock, content: mergedContent };
            newBlocks.splice(index, 1);
            return newBlocks;
        });
        if (targetId) {
            setFocusedId(targetId);
            setAutofocusId(targetId);
        }
    }, []);

    // Handle Tab to cycle block types
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

            if (nextType === 'parenthetical') {
                if (!nextContent.startsWith('(')) nextContent = '(' + nextContent;
                if (!nextContent.endsWith(')')) nextContent = nextContent + ')';
            }

            return { ...b, type: nextType, content: nextContent };
        }));
    }, []);

    return {
        blocks,
        title,
        loading,
        saving,
        drafts,
        activeDraftId,
        activeDraft,
        availableScenes,
        setTitle,
        saveScript,
        switchDraft,
        createDraft,
        renameDraft,
        duplicateDraft,
        deleteDraft,
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

import { useState } from 'react';
import { Layers, Plus, MoreVertical, Edit2, Copy, Trash2, Check, Clock, FileText, X } from 'lucide-react';
import { Button } from './ui/Button';
import type { ScriptDraft } from '../hooks/useEditor';

interface DraftsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    drafts: ScriptDraft[];
    activeDraftId: string;
    onSwitchDraft: (draftId: string) => void;
    onOpenCreateModal: () => void;
    onRenameDraft: (draftId: string, newName: string) => void;
    onDuplicateDraft: (draftId: string) => void;
    onDeleteDraft: (draftId: string) => void;
}

export default function DraftsPanel({
    isOpen,
    onClose,
    drafts,
    activeDraftId,
    onSwitchDraft,
    onOpenCreateModal,
    onRenameDraft,
    onDuplicateDraft,
    onDeleteDraft
}: DraftsPanelProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleStartRename = (draft: ScriptDraft, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(draft.id);
        setEditName(draft.name);
        setOpenMenuId(null);
    };

    const handleSaveRename = (draftId: string, e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editName.trim()) {
            onRenameDraft(draftId, editName.trim());
        }
        setEditingId(null);
    };

    const countScenes = (draft: ScriptDraft) => {
        return draft.blocks?.filter(b => b.type === 'scene').length || 0;
    };

    return (
        <aside className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[320px] md:static md:w-80 md:z-30 border-l border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl h-full flex flex-col shadow-2xl md:shadow-none transition-all duration-300 animate-slide-up">
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent-500/10 text-accent-500 border border-accent-500/20">
                        <Layers className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Drafts & Versions</h3>
                        <p className="text-[11px] text-gray-500">{drafts.length} {drafts.length === 1 ? 'version' : 'versions'} saved</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Close panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Create Draft Action Banner */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50/50 dark:bg-bg-tertiary/20">
                <Button
                    onClick={onOpenCreateModal}
                    variant="primary"
                    size="sm"
                    className="w-full gap-2 text-xs font-semibold shadow-md shadow-accent-500/20"
                >
                    <Plus className="h-4 w-4" />
                    New Draft
                </Button>
            </div>

            {/* Drafts List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {drafts.map((draft) => {
                    const isActive = draft.id === activeDraftId;
                    const isEditing = editingId === draft.id;
                    const isMenuOpen = openMenuId === draft.id;
                    const scenesCount = countScenes(draft);

                    return (
                        <div
                            key={draft.id}
                            onClick={() => {
                                if (!isEditing) {
                                    onSwitchDraft(draft.id);
                                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                        onClose();
                                    }
                                }
                            }}
                            className={`group relative rounded-xl p-3 border transition-all duration-200 cursor-pointer text-left ${isActive
                                ? 'bg-accent-500/10 border-accent-500/50 dark:border-accent-500/40 shadow-sm ring-1 ring-accent-500/20'
                                : 'bg-white dark:bg-bg-secondary/60 hover:bg-gray-50 dark:hover:bg-bg-secondary border-gray-200 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'
                                }`}
                        >
                            {/* Top Row: Name / Rename / Menu */}
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                {isEditing ? (
                                    <form
                                        onSubmit={(e) => handleSaveRename(draft.id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 flex gap-1"
                                    >
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                            onBlur={() => setEditingId(null)}
                                            className="w-full text-xs font-semibold px-2 py-1 bg-white dark:bg-bg-primary border border-accent-500 rounded-lg text-gray-900 dark:text-white outline-none"
                                        />
                                        <button
                                            type="submit"
                                            className="p-1 rounded bg-accent-500 text-white text-xs"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    </form>
                                ) : (
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className={`text-xs font-bold truncate ${isActive ? 'text-accent-600 dark:text-accent-300' : 'text-gray-900 dark:text-gray-200'}`}>
                                                {draft.name}
                                            </h4>
                                            {isActive && (
                                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-accent-500 text-white shadow-xs shrink-0">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Context Menu Trigger */}
                                {!isEditing && (
                                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setOpenMenuId(isMenuOpen ? null : draft.id)}
                                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </button>

                                        {isMenuOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-30"
                                                    onClick={() => setOpenMenuId(null)}
                                                />
                                                <div className="absolute right-0 top-6 w-36 bg-white dark:bg-bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-40 overflow-hidden text-xs">
                                                    <button
                                                        onClick={(e) => handleStartRename(draft, e)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                        Rename
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            onDuplicateDraft(draft.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        Duplicate
                                                    </button>
                                                    {drafts.length > 1 && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Delete "${draft.name}"? This cannot be undone.`)) {
                                                                    onDeleteDraft(draft.id);
                                                                }
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Metadata Row */}
                            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                                <span className="flex items-center gap-1 font-mono">
                                    <FileText className="h-3 w-3" />
                                    {scenesCount} {scenesCount === 1 ? 'scene' : 'scenes'} • {draft.blocks?.length || 0} blocks
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(draft.lastModified || draft.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Tip */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-bg-primary/50 text-[11px] text-gray-500 text-center">
                Click any draft to switch and edit instantly. Changes auto-save to that version.
            </div>
        </aside>
    );
}

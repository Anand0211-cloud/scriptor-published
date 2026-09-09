import { useState } from 'react';
import { X, Copy, CheckSquare, Square, Sparkles, Layers, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { ScriptSceneInfo } from '../hooks/useEditor';

interface CreateDraftModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableScenes: ScriptSceneInfo[];
    currentDraftName: string;
    draftsCount: number;
    onCreateDraft: (options: {
        name: string;
        copyMode: 'all' | 'scenes' | 'blank';
        selectedSceneIds?: string[];
    }) => void;
}

export default function CreateDraftModal({
    isOpen,
    onClose,
    availableScenes,
    currentDraftName,
    draftsCount,
    onCreateDraft
}: CreateDraftModalProps) {
    const [name, setName] = useState(`Draft ${draftsCount + 1}`);
    const [copyMode, setCopyMode] = useState<'all' | 'scenes' | 'blank'>('all');
    const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>(() =>
        availableScenes.map(s => s.id)
    );

    if (!isOpen) return null;

    const handleSelectAllScenes = () => {
        setSelectedSceneIds(availableScenes.map(s => s.id));
    };

    const handleDeselectAllScenes = () => {
        setSelectedSceneIds([]);
    };

    const toggleScene = (sceneId: string) => {
        setSelectedSceneIds(prev =>
            prev.includes(sceneId) ? prev.filter(id => id !== sceneId) : [...prev, sceneId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateDraft({
            name: name.trim() || `Draft ${draftsCount + 1}`,
            copyMode,
            selectedSceneIds: copyMode === 'scenes' ? selectedSceneIds : undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-xl bg-white dark:bg-bg-secondary border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-bg-tertiary/30">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center border border-accent-500/20">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Draft</h2>
                            <p className="text-xs text-gray-500">Fork, revise, or start a new version of this screenplay.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Draft Name */}
                    <div>
                        <Input
                            label="Draft Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Draft 2 - Polish / Director's Cut"
                            required
                            autoFocus
                            variant="glass"
                        />
                    </div>

                    {/* Copy Strategy Selection */}
                    <div className="space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Choose Content Source
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Option 1: Full Copy */}
                            <div
                                onClick={() => setCopyMode('all')}
                                className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col items-start text-left ${copyMode === 'all'
                                    ? 'bg-accent-500/10 border-accent-500 text-accent-600 dark:text-accent-300 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-bg-tertiary/20'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <Copy className="h-4 w-4" />
                                    {copyMode === 'all' && <Check className="h-4 w-4 text-accent-500" />}
                                </div>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">Copy All</span>
                                <span className="text-xs text-gray-500 mt-1">Full clone from {currentDraftName}</span>
                            </div>

                            {/* Option 2: Choose Scenes */}
                            <div
                                onClick={() => setCopyMode('scenes')}
                                className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col items-start text-left ${copyMode === 'scenes'
                                    ? 'bg-accent-500/10 border-accent-500 text-accent-600 dark:text-accent-300 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-bg-tertiary/20'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <CheckSquare className="h-4 w-4" />
                                    {copyMode === 'scenes' && <Check className="h-4 w-4 text-accent-500" />}
                                </div>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">Choose Scenes</span>
                                <span className="text-xs text-gray-500 mt-1">Pick specific scenes to import</span>
                            </div>

                            {/* Option 3: Blank */}
                            <div
                                onClick={() => setCopyMode('blank')}
                                className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col items-start text-left ${copyMode === 'blank'
                                    ? 'bg-accent-500/10 border-accent-500 text-accent-600 dark:text-accent-300 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-bg-tertiary/20'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <Sparkles className="h-4 w-4" />
                                    {copyMode === 'blank' && <Check className="h-4 w-4 text-accent-500" />}
                                </div>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">Blank Draft</span>
                                <span className="text-xs text-gray-500 mt-1">Start fresh from scratch</span>
                            </div>
                        </div>
                    </div>

                    {/* Scene Selection List (Visible only when 'scenes' is picked) */}
                    {copyMode === 'scenes' && (
                        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800/70">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Select Scenes ({selectedSceneIds.length} of {availableScenes.length} selected)
                                </span>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllScenes}
                                        className="text-accent-500 hover:text-accent-400 font-medium transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-400">|</span>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAllScenes}
                                        className="text-gray-500 hover:text-gray-400 font-medium transition-colors"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            {availableScenes.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 dark:bg-bg-tertiary/30 rounded-xl border border-gray-200 dark:border-gray-800">
                                    No scene headings found in the current draft.
                                </div>
                            ) : (
                                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-gray-200 dark:border-gray-800 rounded-xl p-2 bg-gray-50/50 dark:bg-bg-primary/40">
                                    {availableScenes.map(scene => {
                                        const isSelected = selectedSceneIds.includes(scene.id);
                                        return (
                                            <div
                                                key={scene.id}
                                                onClick={() => toggleScene(scene.id)}
                                                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-left ${isSelected
                                                    ? 'bg-white dark:bg-bg-secondary border border-accent-500/30 shadow-sm'
                                                    : 'hover:bg-gray-100 dark:hover:bg-bg-tertiary/50 border border-transparent'
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    className="mt-0.5 text-accent-500 shrink-0"
                                                >
                                                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-gray-400" />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-mono text-gray-400 font-semibold">
                                                            SCENE {scene.sceneNumber}
                                                        </span>
                                                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate font-mono uppercase">
                                                            {scene.heading}
                                                        </p>
                                                    </div>
                                                    {scene.preview && (
                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                            {scene.preview}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800/80">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!name.trim() || (copyMode === 'scenes' && selectedSceneIds.length === 0)}
                        >
                            Create Draft
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

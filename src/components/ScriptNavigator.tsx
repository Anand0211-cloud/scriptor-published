import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ScriptBlock } from '../hooks/useEditor';
import { Film, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScriptNavigatorProps {
    blocks: ScriptBlock[];
    onScrollToBlock: (blockId: string) => void;
}

type NavTab = 'scenes' | 'characters';

interface SceneEntry {
    number: number;
    label: string;
    blockId: string;
}

interface CharacterEntry {
    name: string;
    count: number;
    firstBlockId: string;
}

export default function ScriptNavigator({ blocks, onScrollToBlock }: ScriptNavigatorProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<NavTab>('scenes');

    // Extract scenes
    const scenes = useMemo<SceneEntry[]>(() => {
        let num = 0;
        return blocks
            .filter(b => b.type === 'scene')
            .map(b => {
                num++;
                return {
                    number: num,
                    label: b.content || 'Untitled Scene',
                    blockId: b.id,
                };
            });
    }, [blocks]);

    // Extract unique characters
    const characters = useMemo<CharacterEntry[]>(() => {
        const map = new Map<string, { count: number; firstBlockId: string }>();
        blocks.forEach(b => {
            if (b.type === 'character' && b.content.trim()) {
                const name = b.content.trim().toUpperCase();
                const existing = map.get(name);
                if (existing) {
                    existing.count++;
                } else {
                    map.set(name, { count: 1, firstBlockId: b.id });
                }
            }
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, data]) => ({ name, ...data }));
    }, [blocks]);

    if (collapsed) {
        return (
            <div className="hidden md:flex flex-col items-center py-4 px-1.5 bg-gray-900/95 border-r border-gray-800 gap-3 shrink-0">
                <button
                    onClick={() => setCollapsed(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Expand Navigator"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <button
                    onClick={() => { setCollapsed(false); setActiveTab('scenes'); }}
                    className={clsx(
                        'p-1.5 rounded-lg transition-colors',
                        activeTab === 'scenes' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    )}
                    title="Scenes"
                >
                    <Film className="h-4 w-4" />
                </button>
                <button
                    onClick={() => { setCollapsed(false); setActiveTab('characters'); }}
                    className={clsx(
                        'p-1.5 rounded-lg transition-colors',
                        activeTab === 'characters' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    )}
                    title="Characters"
                >
                    <Users className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="hidden md:flex flex-col w-[260px] shrink-0 bg-gray-900/95 border-r border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Navigator</span>
                <button
                    onClick={() => setCollapsed(true)}
                    className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                    title="Collapse"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('scenes')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                        activeTab === 'scenes'
                            ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
                            : 'text-gray-500 hover:text-gray-300'
                    )}
                >
                    <Film className="h-3.5 w-3.5" />
                    Scenes
                    <span className={clsx(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                        activeTab === 'scenes' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800 text-gray-500'
                    )}>
                        {scenes.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('characters')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                        activeTab === 'characters'
                            ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                            : 'text-gray-500 hover:text-gray-300'
                    )}
                >
                    <Users className="h-3.5 w-3.5" />
                    Cast
                    <span className={clsx(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                        activeTab === 'characters' ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-800 text-gray-500'
                    )}>
                        {characters.length}
                    </span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === 'scenes' && (
                    <div className="py-2">
                        {scenes.length === 0 ? (
                            <p className="text-gray-600 text-xs px-3 py-4 text-center italic">No scenes yet</p>
                        ) : (
                            scenes.map(scene => (
                                <button
                                    key={scene.blockId}
                                    onClick={() => onScrollToBlock(scene.blockId)}
                                    className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-gray-800/60 transition-colors group cursor-pointer"
                                >
                                    <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded bg-indigo-500/15 text-indigo-400 text-[10px] font-bold mt-0.5">
                                        {scene.number}
                                    </span>
                                    <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-tight font-mono uppercase truncate">
                                        {scene.label}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'characters' && (
                    <div className="py-2">
                        {characters.length === 0 ? (
                            <p className="text-gray-600 text-xs px-3 py-4 text-center italic">No characters yet</p>
                        ) : (
                            characters.map(char => (
                                <button
                                    key={char.name}
                                    onClick={() => onScrollToBlock(char.firstBlockId)}
                                    className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-800/60 transition-colors group cursor-pointer"
                                >
                                    <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-violet-500/15 text-violet-400 text-[10px] font-bold uppercase">
                                        {char.name.charAt(0)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-semibold uppercase truncate block">
                                            {char.name}
                                        </span>
                                        <span className="text-[10px] text-gray-600">
                                            {char.count} {char.count === 1 ? 'line' : 'lines'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

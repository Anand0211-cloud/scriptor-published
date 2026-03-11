import { FileText, MoreVertical, Edit, Trash2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';

// Define the shape of a script object
export interface Script {
    id: string;
    title: string;
    last_modified: string;
}

interface ScriptCardProps {
    script: Script;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}

export default function ScriptCard({ script, onRename, onDelete }: ScriptCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(script.title);

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRename(script.id, newName);
        setIsRenaming(false);
    };

    return (
        <Card
            variant="glass"
            className="group relative h-full flex flex-col p-4 transition-all duration-300 hover:shadow-accent-500/10 hover:border-accent-500/30 bg-white dark:bg-bg-secondary/40"
        >
            <Link to={`/editor/${script.id}`} className="block flex-1">
                {/* Thumbnail / Icon Area */}
                <div className="relative aspect-[3/4] bg-gray-100 dark:bg-bg-tertiary rounded-lg mb-4 overflow-hidden border border-gray-200 dark:border-gray-800 group-hover:border-accent-500/30 transition-colors shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/5 dark:to-black/20">
                        <FileText className="h-16 w-16 text-gray-400 dark:text-gray-700 group-hover:text-accent-500 transition-colors duration-500 drop-shadow-lg" />
                    </div>

                    {/* Abstract page lines */}
                    <div className="absolute top-6 left-6 right-6 space-y-3 opacity-10 pointer-events-none">
                        <div className="h-1.5 w-1/3 bg-white rounded-full"></div>
                        <div className="h-1.5 w-full bg-white rounded-full"></div>
                        <div className="h-1.5 w-full bg-white rounded-full"></div>
                        <div className="h-1.5 w-full bg-white rounded-full"></div>
                        <div className="h-1.5 w-3/4 bg-white rounded-full"></div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-accent-500/10 dark:bg-accent-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="space-y-1.5">
                    {isRenaming ? (
                        <form onSubmit={handleRenameSubmit} onClick={(e) => e.preventDefault()}>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                                onBlur={() => setIsRenaming(false)}
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-bg-tertiary border border-accent-500 rounded focus:outline-none text-gray-900 dark:text-white"
                            />
                        </form>
                    ) : (
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base tracking-tight group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors" title={script.title}>
                            {script.title}
                        </h3>
                    )}

                    <div className="flex items-center text-xs text-gray-500 gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(script.last_modified).toLocaleDateString()}</span>
                    </div>
                </div>
            </Link>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-bg-tertiary text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-bg-secondary rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 py-1 z-20 overflow-hidden"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsRenaming(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <Edit className="h-3.5 w-3.5" /> Rename
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onDelete(script.id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Card>
    );
}

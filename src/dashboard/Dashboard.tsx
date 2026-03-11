import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import ScriptCard, { type Script } from './ScriptCard';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

export default function Dashboard() {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const fetchScripts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('scripts')
                .select('id, title, last_modified')
                .eq('user_id', user.id)
                .order('last_modified', { ascending: false });

            if (error) {
                console.error('Error fetching scripts:', error);
            } else {
                setScripts(data as Script[]);
            }
            setLoading(false);
        };

        fetchScripts();
    }, [user]);

    const handleCreateScript = async () => {
        if (!user) return;

        const newId = uuidv4();
        const newScript = {
            id: newId,
            user_id: user.id,
            title: 'Untitled Screenplay',
            content: [],
        };

        // Optimistically add to UI
        const uiScript = {
            id: newId,
            title: newScript.title,
            last_modified: new Date().toISOString()
        };
        setScripts([uiScript, ...scripts]);

        // Save to DB
        const { error } = await supabase.from('scripts').insert(newScript);

        if (error) {
            console.error('Error creating script:', error);
            // Optionally remove from UI on failure
            setScripts(scripts.filter(s => s.id !== newId));
            return;
        }

        navigate(`/editor/${newId}`);
    };

    const handleRename = async (id: string, newName: string) => {
        // Optimistic update
        setScripts(scripts.map(s => s.id === id ? { ...s, title: newName } : s));

        const { error } = await supabase
            .from('scripts')
            .update({ title: newName })
            .eq('id', id);

        if (error) {
            console.error('Error renaming script:', error);
            // Could revert UI here on failure
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this script?')) {
            // Optimistic update
            const oldScripts = [...scripts];
            setScripts(scripts.filter(s => s.id !== id));

            const { error } = await supabase
                .from('scripts')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting script:', error);
                // Revert on failure
                setScripts(oldScripts);
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="h-full p-6 md:p-12 md:max-w-7xl md:mx-auto w-full animate-fade-in">
                <div className="space-y-10">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800/30">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                                Studio Overview
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg font-light">
                                Manage your storylines and screenplays.
                            </p>
                        </div>
                        <Button
                            onClick={handleCreateScript}
                            size="lg"
                            className="shadow-lg shadow-accent-500/20"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            New Screenplay
                        </Button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                        <div className="w-full sm:max-w-md">
                            <Input
                                placeholder="Search scripts..."
                                startIcon={<Search className="h-4 w-4" />}
                                variant="glass"
                                className="bg-white dark:bg-bg-secondary/50 border-gray-200 dark:border-gray-800 focus:border-accent-500 focus:dark:border-accent-500/50"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button variant="secondary" size="sm" className="w-full sm:w-auto bg-white dark:bg-bg-secondary/50 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>

                    {/* Scripts Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Create New Card (Visual shortcut) */}
                            <div
                                onClick={handleCreateScript}
                                className="group cursor-pointer rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-bg-secondary/30 hover:bg-gray-100 dark:hover:bg-bg-secondary/60 hover:border-accent-500/50 dark:hover:border-accent-500/30 transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center text-center p-6"
                            >
                                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-bg-tertiary flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-accent-100 dark:group-hover:bg-accent-500/20 transition-all duration-300">
                                    <Plus className="h-8 w-8 text-gray-500 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-200 text-lg group-hover:text-accent-600 dark:group-hover:text-white transition-colors">New Screenplay</h3>
                                <p className="text-sm text-gray-500 mt-2 max-w-[180px]">Begin your next great story</p>
                            </div>

                            {scripts.map((script, index) => (
                                <div key={script.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                    <ScriptCard
                                        script={script}
                                        onRename={handleRename}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

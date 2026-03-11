import { useState, type ReactNode } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, Moon, Sun, Settings, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Studio', path: '/' },
        // Instead of a broken route, make All Scripts also point to dashboard for now
        { icon: FileText, label: 'All Scripts', path: '/' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex transition-colors duration-200 font-sans selection:bg-accent-500/30 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 lg:static lg:w-72 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800/50">
                    <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-accent-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20 transform hover:rotate-6 transition-all duration-300">
                            <span className="text-white font-bold text-xl font-mono">C</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white ml-4 tracking-tight">Cinemar</span>
                    </div>
                    {/* Close button for mobile */}
                    <button className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-8 flex flex-col gap-2 px-4 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                        Menu
                    </div>
                    {menuItems.map((item, idx) => {
                        // Special check: Since both Studio and All Scripts point to '/', 
                        // let's just highlight Studio when on '/', else exact match.
                        const isActive = item.label === 'Studio' ? location.pathname === '/' : false;

                        return (
                            <Link
                                key={`${item.label}-${idx}`}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400 shadow-sm border border-accent-500/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                title={item.label}
                            >
                                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                                <span>{item.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-600 dark:bg-accent-400 shadow-glow-sm" />}
                            </Link>
                        );
                    })}
                </div>

                {/* User & Controls */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800/50 bg-gray-50/50 dark:bg-[#111827]/50 backdrop-blur-sm mt-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.email?.split('@')[0]}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <p className="text-xs text-gray-500">Online</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700/50 shadow-sm"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            <span className="inline">Theme</span>
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all border border-gray-200 dark:border-gray-700/50 shadow-sm"
                            title="Sign Out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-white dark:bg-[#030712] relative">
                {/* Mobile Header for hamburger menu */}
                <div className="lg:hidden flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#030712] z-10 shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 mr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {location.pathname === '/' ? 'Studio Overview' : 'Dashboard'}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}

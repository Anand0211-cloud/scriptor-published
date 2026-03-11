import type { ReactNode } from 'react';
import { Film } from 'lucide-react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex bg-paper dark:bg-bg-primary text-gray-900 dark:text-gray-100 font-sans selection:bg-accent-500/30">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-20 relative z-10 transition-all duration-500 ease-in-out bg-paper dark:bg-bg-primary">
                <div className="mx-auto w-full max-w-sm lg:max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="mx-auto lg:mx-0 h-10 w-10 bg-gradient-to-br from-accent-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/20 mb-8 animate-fade-in">
                            <Film className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white animate-slide-up">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    </div>

                    <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Right Side - Visual / Cinematic Background */}
            <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary to-bg-primary z-0">
                    {/* Abstract Cinematic Elements - Removed purely blurred blobs to prevent artifacts */}
                    {/* <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-accent-600/10 blur-3xl filter" /> */}
                    {/* <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl filter" /> */}

                    {/* Dark overlay pattern */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center px-12 text-white">
                    <blockquote className="space-y-6 max-w-lg mx-auto">
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 text-accent-500 opacity-20 transform -translate-x-2 -translate-y-2">
                                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.5 25L20 12.5H10L10 0L0 12.5H10L2.5 25H12.5ZM37.5 25L45 12.5H35L35 0L25 12.5H35L27.5 25H37.5Z" fill="currentColor" />
                                </svg>
                            </div>
                            <p className="font-mono text-xl sm:text-2xl leading-relaxed text-gray-200">
                                "Every great film begins with a single word. Cinemar gives that word the stage it deserves."
                            </p>
                        </div>
                        <footer className="mt-4">
                            <div className="font-semibold text-accent-200">Sarah Jenkins</div>
                            <div className="text-gray-500 text-sm">Award-winning Screenwriter</div>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}

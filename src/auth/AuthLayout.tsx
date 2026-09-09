import type { ReactNode } from 'react';
import logoImg from '../assets/logo.png';

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
                <div className="mx-auto w-full max-w-sm lg:max-w-md space-y-5">
                    <div className="text-left">
                        <div className="flex justify-start mb-2 animate-fade-in">
                            <img
                                src={logoImg}
                                alt="Cinemar Scripter"
                                className="h-16 sm:h-20 w-auto max-w-[280px] sm:max-w-[320px] object-contain filter dark:brightness-100 brightness-75 drop-shadow-md"
                            />
                        </div>
                        <h2 className="mt-0 text-3xl font-bold tracking-tight text-gray-900 dark:text-white animate-slide-up">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    </div>

                    <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Right Side - Visual / Cinematic Background */}
            <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary to-bg-primary z-0">
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
                            <div className="text-gray-400 text-sm">Award-winning Screenwriter</div>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}

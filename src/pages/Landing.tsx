import { Link } from 'react-router-dom';
import { Film, Check, PenTool, Cloud, Download, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen font-sans">
            {/* Header */}
            <header className="fixed w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center transform rotate-3 shadow-glow">
                                <Film className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Cinemar</span>
                        </div>
                        <nav className="hidden md:flex gap-8">
                            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Features</a>
                            <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Pricing</a>
                            <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">About</a>
                        </nav>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Log in</Link>
                            <Link to="/signup" className="text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all hover:shadow-glow">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <div className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
                            >
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6 border border-indigo-100 dark:border-indigo-800">
                                    <Star className="h-3 w-3 mr-2 fill-indigo-600 dark:fill-indigo-400" /> v1.0 is live
                                </div>
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                                    <span className="block">Screenwriting for</span>
                                    <span className="block text-indigo-600 dark:text-indigo-500">the modern auteur</span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    Focus on your story with our distraction-free, cloud-based editor.
                                    Industry-standard formatting, auto-save, and PDF export built for professionals.
                                </p>
                                <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row gap-4">
                                    <Link
                                        to="/signup"
                                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 md:py-4 md:text-lg transition-all hover:shadow-glow hover:-translate-y-1"
                                    >
                                        Start Writing for Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center px-8 py-3 border border-gray-200 dark:border-gray-700 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 md:py-4 md:text-lg transition-colors"
                                    >
                                        Live Demo
                                    </Link>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20, rotate: 2 }}
                                animate={{ opacity: 1, x: 0, rotate: -2 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
                            >
                                <div className="relative mx-auto w-full rounded-lg shadow-2xl lg:max-w-md bg-gray-900 overflow-hidden ring-1 ring-white/10 transform hover:rotate-0 transition-transform duration-700">
                                    <div className="absolute top-0 left-0 w-full h-8 bg-gray-800 flex items-center px-3 space-x-1.5 border-b border-gray-700">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                    </div>
                                    <div className="pt-12 px-8 pb-12 font-mono text-gray-300 text-xs leading-relaxed space-y-4 bg-gray-900">
                                        <p><span className="text-gray-500">1.</span> <span className="text-white font-bold ml-4">INT. SPACESHIP - COCKPIT - DAY</span></p>
                                        <p><span className="text-gray-500">2.</span> <span className="ml-4">Sparks fly. ALARM KLAXONS blare.</span></p>
                                        <div className="flex justify-center"><span className="text-white font-bold tracking-wider">COMMANDER</span></div>
                                        <div className="flex justify-center text-center px-8">We're losing containment! Reroute power to the main thrusters!</div>
                                        <p><span className="text-gray-500">3.</span> <span className="ml-4">The ship SHUDDERS violently.</span></p>
                                        <div className="flex justify-center"><span className="text-white font-bold tracking-wider">PILOT</span></div>
                                        <div className="flex justify-center text-center px-8">I'm trying, but the controls are locked out!</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="lg:text-center mb-16">
                            <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Core Features</h2>
                            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                                Everything you need to tell your story
                            </p>
                            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
                                We handled the technical details so you can stay in the flow state.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {[
                                {
                                    icon: PenTool,
                                    title: "Smart Formatting",
                                    desc: "Scene headings, dialogue, characters—formatted automatically as you type. No manual indentation required."
                                },
                                {
                                    icon: Cloud,
                                    title: "Cloud Sync",
                                    desc: "Your scripts are saved instantly to the secure cloud. Access your work from any device, anywhere."
                                },
                                {
                                    icon: Download,
                                    title: "Ready for Export",
                                    desc: "One-click PDF export that adheres to strict Hollywood industry standards, ready for submission."
                                },
                                {
                                    icon: Check,
                                    title: "Focus Mode",
                                    desc: "A distraction-free interface that fades away everything except your words when you need to concentrate."
                                }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="relative p-8 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:border-indigo-500/30 transition-all duration-300"
                                >
                                    <div className="absolute top-8 left-8">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            <feature.icon className="h-6 w-6" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <div className="ml-20">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-gray-950">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <span className="font-bold text-lg text-gray-900 dark:text-white">Cinemar</span>
                            <span className="text-sm text-gray-500 dark:text-gray-500">© 2024</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">Twitter</a>
                            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">GitHub</a>
                            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">Discord</a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

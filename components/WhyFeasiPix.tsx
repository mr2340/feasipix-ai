import React, { useEffect, useRef, useState } from 'react';
import { LightBulbIcon, UserCircleIcon, SparklesIcon, ShareIcon, ClipboardIcon, DownloadIcon, RocketLaunchIcon, ChatBubbleOvalLeftEllipsisIcon, GeminiIcon, SupabaseIcon, ReactIcon, TailwindIcon } from './IconComponents';

interface WhyFeasiPixProps {
    onBack: () => void;
}

const WhyFeasiPix: React.FC<WhyFeasiPixProps> = ({ onBack }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const { clientX, clientY } = e;
                requestAnimationFrame(() => {
                    if (containerRef.current) {
                        containerRef.current.style.setProperty('--mouse-x', `${clientX}px`);
                        containerRef.current.style.setProperty('--mouse-y', `${clientY}px`);
                    }
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    const handleShare = () => {
        const shareableLink = window.location.href;
        navigator.clipboard.writeText(shareableLink).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        });
    };
    
    const handleDownloadPdf = () => {
        window.print();
    };

    return (
        <div ref={containerRef} className="relative py-12 text-slate-900 dark:text-white overflow-hidden why-feasipix-bg">
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center mb-16 animate-fade-in-down">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
                        Why FeasiPix?
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">The Story, Vision, and Technology Behind the Magic.</p>
                </div>

                {/* Share Buttons */}
                <div className="mb-12 flex justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <button onClick={handleShare} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold py-2 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
                        {copySuccess ? <ClipboardIcon className="w-5 h-5 text-green-500" /> : <ShareIcon className="w-5 h-5" />}
                        {copySuccess ? 'Link Copied!' : 'Copy Shareable Link'}
                    </button>
                    <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold py-2 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md print-hidden">
                        <DownloadIcon className="w-5 h-5" />
                        Download as PDF
                    </button>
                </div>
                
                <section className="space-y-16">
                    {/* Vision Section */}
                    <div className="p-1 rounded-2xl bg-gradient-to-br from-indigo-500/50 via-purple-500/50 to-pink-500/50 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <LightBulbIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                                <h2 className="text-3xl font-bold">Our Vision</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">
                                To democratize creativity by making professional-grade photo editing accessible to everyone. We believe that bringing an idea to life should be as simple as describing it. FeasiPix was born from the desire to replace complex tools and steep learning curves with an intuitive, AI-powered experience that focuses purely on your imagination.
                            </p>
                            <div className="mt-6 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-lg mb-2">What We Believe:</h4>
                                <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                    <li><strong>Simplicity is Power:</strong> The best tools are the ones you don't have to think about.</li>
                                    <li><strong>Creativity for All:</strong> Your ideas shouldn't be limited by your technical skills.</li>
                                    <li><strong>Ethical AI:</strong> We're committed to building technology that empowers, not deceives.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* My Journey Section */}
                    <div className="p-1 rounded-2xl bg-gradient-to-br from-purple-500/50 via-pink-500/50 to-orange-400/50 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <UserCircleIcon className="w-8 h-8 text-pink-500 dark:text-pink-400" />
                                <h2 className="text-3xl font-bold">My Journey</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">
                                As a Computer Science student, I saw a gap between powerful technology and everyday users. The "aha!" moment came when I saw a friend struggling for hours with complex software just to change a background. I knew there had to be a better way. FeasiPix started as a personal project to bridge that gap. The goal was simple: create an editor that felt like magic, where you could turn your phone into a professional studio without leaving home.
                            </p>
                            <blockquote className="mt-6 pl-4 border-l-4 border-slate-200 dark:border-slate-700 italic text-slate-600 dark:text-slate-400">
                                "This project is not just code; it's a culmination of passion, late-night study sessions, and the belief that technology should empower, not intimidate."
                            </blockquote>
                        </div>
                    </div>

                    {/* Tech Showcase Section */}
                    <div className="p-1 rounded-2xl bg-gradient-to-br from-pink-500/50 via-orange-400/50 to-yellow-400/50 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <SparklesIcon className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                                <h2 className="text-3xl font-bold">Powered by Innovation</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                                FeasiPix is built on the shoulders of giants. We leverage cutting-edge AI and robust backend services to deliver a seamless and powerful editing experience. Here's why we chose our stack:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <GeminiIcon className="w-6 h-6 text-purple-500"/>
                                        <p className="font-bold text-lg">Google's Gemini API</p>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        <strong>Why:</strong> For its state-of-the-art multimodal understanding. It's the core intelligence that interprets your text and visually reconstructs images with incredible accuracy.
                                    </p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                                     <div className="flex items-center gap-3 mb-2">
                                        <SupabaseIcon className="w-6 h-6 text-green-500"/>
                                        <p className="font-bold text-lg">Supabase</p>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        <strong>Why:</strong> It provides a secure, scalable, all-in-one backend. From authentication to file storage, it lets us focus on features, not infrastructure.
                                    </p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ReactIcon className="w-6 h-6 text-blue-500"/>
                                        <p className="font-bold text-lg">React & TypeScript</p>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        <strong>Why:</strong> To build a fast, modern, and reliable user interface. TypeScript ensures our code is robust and bug-free, leading to a smoother experience for you.
                                    </p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TailwindIcon className="w-6 h-6 text-cyan-500"/>
                                        <p className="font-bold text-lg">Tailwind CSS</p>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        <strong>Why:</strong> For speed and consistency. It enables us to rapidly build a clean, responsive, and aesthetically pleasing design that works on any device.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* The Road Ahead Section */}
                    <div className="p-1 rounded-2xl bg-gradient-to-br from-cyan-500/50 via-blue-500/50 to-indigo-500/50 animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <RocketLaunchIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
                                <h2 className="text-3xl font-bold">The Road Ahead</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">
                                Our journey is just beginning. We're constantly exploring new AI capabilities and listening to your feedback to make FeasiPix even better. Here's a glimpse of what's next:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-2 text-slate-600 dark:text-slate-400">
                                <li><strong>Video Editing Tools:</strong> Bringing the same text-prompt magic to your video clips.</li>
                                <li><strong>AI-Powered Style Transfer:</strong> Apply the style of famous artworks to your photos.</li>
                                <li><strong>Team Collaboration:</strong> Share and edit projects with friends or colleagues.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Join Our Journey Section */}
                    <div className="p-1 rounded-2xl bg-gradient-to-br from-green-400/50 via-teal-500/50 to-cyan-500/50 animate-fade-in-up" style={{ animationDelay: '1200ms' }}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 text-center">
                            <ChatBubbleOvalLeftEllipsisIcon className="w-10 h-10 text-teal-500 dark:text-teal-400 mx-auto mb-3" />
                            <h2 className="text-3xl font-bold">Join Our Journey</h2>
                            <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                                FeasiPix is built for you, and we'd love to hear your ideas. Your feedback will shape the future of our platform. Have a feature request or a suggestion? Let us know!
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '1400ms' }}>
                    <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors hover:underline">
                        &larr; Back to Dashboard
                    </button>
                </div>
            </div>
            <style>{`
                .why-feasipix-bg {
                    background-color: rgb(248 250 252);
                }
                .dark .why-feasipix-bg {
                    background-color: rgb(15 23 42 / 0.95);
                }
                .why-feasipix-bg::before {
                    content: "";
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    background: radial-gradient(
                        1000px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
                        rgba(168, 85, 247, 0.15),
                        transparent 80%
                    );
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                .why-feasipix-bg:hover::before {
                    opacity: 1;
                }

                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 600ms ease-out forwards;
                }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 600ms ease-out forwards;
                }

                @media print {
                    .print-hidden {
                        display: none;
                    }
                    body {
                        background-color: white !important;
                    }
                    .why-feasipix-bg {
                        background-color: white !important;
                        color: black !important;
                    }
                    .dark .why-feasipix-bg {
                         background-color: white !important;
                         color: black !important;
                    }
                    .text-slate-900, .dark .text-white {
                        color: black !important;
                    }
                    .bg-slate-50, .dark .bg-slate-900, .bg-slate-100, .dark .bg-slate-800\/50, .bg-slate-100, .dark .bg-slate-800\/50 {
                        background-color: #f8fafc !important;
                        border: 1px solid #e2e8f0;
                    }
                    .text-slate-600, .dark .text-slate-300, .text-slate-500, .dark .text-slate-400 {
                        color: #475569 !important;
                    }
                    .bg-gradient-to-r {
                        background: none !important;
                        -webkit-background-clip: initial !important;
                        -webkit-text-fill-color: initial !important;
                        color: #4f46e5 !important;
                    }
                    .text-transparent {
                        color: #4f46e5 !important;
                    }
                    .p-1 {
                        background: none !important;
                    }
                    .shadow-lg, .shadow-xl, .shadow-2xl {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default WhyFeasiPix;
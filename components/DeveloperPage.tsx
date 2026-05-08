import React, { useEffect, useRef } from 'react';
import { UserCircleIcon, HeartIcon, GithubIcon, LinkedInIcon } from './IconComponents';

interface DeveloperPageProps {
    onBack: () => void;
}

const developers = [
    {
        isMain: true,
        name: 'Awolola Victor',
        nickname: 'Graphic Heart or GH Codes',
        role: 'Computer Science Student, 200 Level',
        versionStatement: 'My version makes it possible to edit without leaving home, turning your phone into a studio. Built also as my school project.',
        imageUrl: 'https://i.pinimg.com/736x/3b/47/a7/3b47a7a7e4aa4bc2d51120a2b45bd31f.jpg',
        acknowledgement: 'A special vote of thanks to GOD, my parents, families, and my awesome friend Mercy Ayankule for their unwavering support.',
        socials: {
            github: 'https://github.com/ghcodes',
            linkedin: 'https://www.linkedin.com/in/victorawolola/'
        }
    },
    {
        isMain: false,
        name: 'AI Co-Developer',
        nickname: 'Gemini',
        role: 'Api GENERATOR {Nano banner}',
        versionStatement: 'Assisted in code generation, UI/UX design, and feature implementation to accelerate development and enhance user experience.',
        imageUrl: 'https://i.pinimg.com/736x/39/90/df/3990df0dae64319819b75bf9d0e793b2.jpg',
    }
];

const DeveloperPage: React.FC<DeveloperPageProps> = ({ onBack }) => {
    const mainDev = developers.find(d => d.isMain);
    const otherDevs = developers.filter(d => !d.isMain);
    const containerRef = useRef<HTMLDivElement>(null);

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

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            className="relative py-12 text-slate-900 dark:text-white overflow-hidden developer-aurora-bg"
        >
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div 
                    className="text-center mb-12 animate-fade-in-down opacity-0"
                    style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}
                >
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        Meet the Developers
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">The creative minds behind FeasiPix.</p>
                </div>

                {/* Main Developer */}
                {mainDev && (
                    <div 
                        className="group relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-2 animate-fade-in-up opacity-0"
                        style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}
                    >
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                {mainDev.imageUrl ? (
                                    <img src={mainDev.imageUrl} alt={mainDev.name} className="w-32 h-32 rounded-full object-cover flex-shrink-0 border-4 border-white dark:border-slate-700 shadow-lg" />
                                ) : (
                                    <UserCircleIcon className="w-32 h-32 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                )}
                                <div className="text-center sm:text-left">
                                    <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Main Developer</span>
                                    <h2 className="text-3xl font-bold mt-1">{mainDev.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400">{mainDev.nickname}</p>
                                    <p className="mt-2 font-medium text-slate-700 dark:text-slate-300">{mainDev.role}</p>
                                    <blockquote className="mt-4 pl-4 border-l-4 border-slate-200 dark:border-slate-700 italic text-slate-600 dark:text-slate-400">
                                        "{mainDev.versionStatement}"
                                    </blockquote>
                                    {mainDev.socials && (
                                        <div className="mt-6 flex items-center justify-center sm:justify-start gap-5">
                                            <a href={mainDev.socials.github} target="_blank" rel="noopener noreferrer" title="GitHub Profile" className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                                                <GithubIcon className="w-6 h-6" />
                                            </a>
                                            <a href={mainDev.socials.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn Profile" className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors duration-200">
                                                <LinkedInIcon className="w-6 h-6" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vote of Thanksgiving Card */}
                {mainDev && mainDev.acknowledgement && (
                    <div 
                        className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-lg shadow-lg text-center mt-12 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in-up opacity-0"
                        style={{ animationFillMode: 'forwards', animationDelay: '500ms' }}
                    >
                        <div className="inline-block bg-pink-500/10 dark:bg-pink-500/20 p-3 rounded-full mb-4">
                            <HeartIcon className="w-8 h-8 text-pink-500 dark:text-pink-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Vote of Thanksgiving</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-400 italic max-w-2xl mx-auto">
                            {mainDev.acknowledgement}
                        </p>
                    </div>
                )}
                
                {/* Other Developers */}
                {otherDevs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-12">
                        {otherDevs.map((dev, index) => (
                            <div 
                                key={index} 
                                className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in-up opacity-0"
                                style={{ animationFillMode: 'forwards', animationDelay: `${700 + index * 200}ms` }}
                            >
                                <div className="flex items-center gap-6">
                                    {dev.imageUrl ? (
                                        <img src={dev.imageUrl} alt={dev.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-white dark:border-slate-600" />
                                    ) : (
                                        <UserCircleIcon className="w-20 h-20 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold">{dev.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">{dev.nickname}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{dev.role}</p>
                                    </div>
                                </div>
                                <blockquote className="mt-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 italic text-sm text-slate-600 dark:text-slate-400">
                                    "{dev.versionStatement}"
                                </blockquote>
                            </div>
                        ))}
                    </div>
                )}

                <div 
                    className="mt-12 text-center animate-fade-in-up opacity-0"
                    style={{ animationFillMode: 'forwards', animationDelay: '900ms' }}
                >
                    <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors hover:underline">
                        &larr; Back
                    </button>
                </div>
            </div>
            <style>{`
                .developer-aurora-bg {
                    background-color: rgb(255 255 255);
                }
                .dark .developer-aurora-bg {
                    background-color: rgb(15 23 42);
                }
                .developer-aurora-bg::before {
                    content: "";
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    background: radial-gradient(
                        800px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
                        rgba(124, 58, 237, 0.15),
                        transparent 80%
                    );
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                .developer-aurora-bg:hover::before {
                    opacity: 1;
                }

                @keyframes fade-in-down {
                    0% {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-down {
                    animation-name: fade-in-down;
                    animation-duration: 600ms;
                    animation-timing-function: ease-out;
                }
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation-name: fade-in-up;
                    animation-duration: 600ms;
                    animation-timing-function: ease-out;
                }
            `}</style>
        </div>
    );
};

export default DeveloperPage;
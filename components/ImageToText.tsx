import React, { useState, useRef, useEffect } from 'react';
import { useGeminiService } from '../services/geminiService';
import Loader from './Loader';
import { ArrowUpTrayIcon, ClipboardIcon, DownloadIcon, PhotoIcon } from './IconComponents';

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = (error) => reject(error);
    });
}

interface ImageToTextProps {
    onBack: () => void;
}

const ImageToText: React.FC<ImageToTextProps> = ({ onBack }) => {
    const [image, setImage] = useState<{ url: string; file: File; } | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const { generatePromptFromImage } = useGeminiService();
    const dragCounter = useRef(0);

    const handleFileChange = (file: File | null) => {
        if (file) {
            const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError("Invalid file type. Please use PNG, JPG, or WEBP.");
                return;
            }
            setError(null);
            setGeneratedPrompt('');
            const url = URL.createObjectURL(file);
            setImage({ url, file });
        }
    };
    
    const handleFileChangeRef = useRef(handleFileChange);
    handleFileChangeRef.current = handleFileChange;

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        event.preventDefault();
                        handleFileChangeRef.current(file);
                        return; // only handle one image
                    }
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    const handleGeneratePrompt = async () => {
        if (!image) return;
        setIsLoading(true);
        setError(null);
        setGeneratedPrompt('');
        try {
            const base64Image = await fileToBase64(image.file);
            const promptText = await generatePromptFromImage(base64Image, image.file.type);
            setGeneratedPrompt(promptText);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    
    const handleDownload = () => {
        if (!generatedPrompt) return;
        const blob = new Blob([generatedPrompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-prompt.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Drag & Drop handlers
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white">
            <h1 className="text-3xl font-bold mb-2">Image to Text Prompt Generator</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Upload an image to generate a detailed text prompt describing its style, composition, lighting, and more.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Upload & Preview */}
                <div className="space-y-4">
                    <div 
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 h-64 flex flex-col items-center justify-center"
                    >
                        {isDragging && (
                            <div className="absolute inset-0 bg-slate-200/90 dark:bg-slate-700/90 z-10 flex flex-col items-center justify-center rounded-lg border-indigo-500">
                                <ArrowUpTrayIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                                <p className="text-lg font-semibold text-slate-800 dark:text-white mt-2">Drop your image</p>
                            </div>
                        )}
                        <PhotoIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                        <input
                            type="file"
                            id="image-to-text-upload"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            accept="image/png, image/jpeg, image/webp"
                        />
                        <label htmlFor="image-to-text-upload" className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300">
                            Choose a file
                        </label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">or drag & drop or paste</p>
                    </div>
                    {image && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Image Preview:</h3>
                            <img src={image.url} alt="Upload preview" className="rounded-md max-h-64 w-full object-contain" />
                        </div>
                    )}
                </div>

                {/* Right: Prompt & Actions */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg shadow-lg flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Generated Prompt</h2>
                    <div className="flex-grow bg-slate-100 dark:bg-slate-900 rounded-md p-4 overflow-y-auto min-h-[200px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader />
                            </div>
                        ) : generatedPrompt ? (
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{generatedPrompt}</p>
                        ) : (
                            <p className="text-slate-400 dark:text-slate-500 text-center self-center my-auto">Your generated prompt will appear here.</p>
                        )}
                    </div>
                    {error && <p className="text-red-500 dark:text-red-400 mt-2 text-sm">{error}</p>}
                    <div className="mt-4 space-y-2">
                        <button
                            onClick={handleGeneratePrompt}
                            disabled={!image || isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Generating...' : 'Generate Prompt'}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleCopy} disabled={!generatedPrompt || isLoading} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-colors">
                                <ClipboardIcon className="w-4 h-4" /> {copySuccess ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={handleDownload} disabled={!generatedPrompt || isLoading} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-colors">
                                <DownloadIcon className="w-4 h-4" /> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 text-center">
                 <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300">
                    &larr; Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default ImageToText;

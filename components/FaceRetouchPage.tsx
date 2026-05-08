import React, { useState, useRef, useEffect } from 'react';
import { useGeminiService } from '../services/geminiService';
import Loader from './Loader';
import { ArrowUpTrayIcon, DownloadIcon, PhotoIcon, SparklesIcon, UndoIcon, RedoIcon, MagicWandIcon, FaceSmileIcon, BackspaceIcon, SunIcon, EyeIcon, ArrowPathIcon } from './IconComponents';
import ReactCompareImage from 'react-compare-image';

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

const parseDataUrl = (dataUrl: string): { mimeType: string; base64: string } | null => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        console.error("Invalid data URL format");
        return null;
    }
    return {
        mimeType: match[1],
        base64: match[2]
    };
};

interface FaceRetouchPageProps {
    onBack: () => void;
}

const FaceRetouchPage: React.FC<FaceRetouchPageProps> = ({ onBack }) => {
    const [originalImage, setOriginalImage] = useState<{ url: string; file: File; } | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { retouchFace } = useGeminiService();
    const dragCounter = useRef(0);

    const handleRetouch = async (prompt: string, message: string) => {
        if (history.length === 0) return;
    
        setIsLoading(true);
        setLoadingMessage(message);
        setError(null);
    
        try {
            const currentImageUrl = history[historyIndex];
            const parsedData = parseDataUrl(currentImageUrl);

            if (!parsedData) {
                throw new Error("Could not process the current image. It might be in an invalid format.");
            }
            
            const { base64, mimeType } = parsedData;
    
            const retouchedBase64 = await retouchFace(base64, mimeType, prompt);
            
            // The AI model always returns a PNG for image edits.
            const newImageUrl = `data:image/png;base64,${retouchedBase64}`;
    
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newImageUrl);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
    
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during retouching.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleFileChange = async (file: File | null) => {
        if (file) {
            const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError("Invalid file type. Please use PNG, JPG, or WEBP.");
                return;
            }
            setError(null);
            const url = URL.createObjectURL(file);
            setOriginalImage({ url, file });
            const base64 = await fileToBase64(file);
            const dataUrl = `data:${file.type};base64,${base64}`;
            setHistory([dataUrl]);
            setHistoryIndex(0);
        }
    };
    
    const handleFileChangeRef = useRef(handleFileChange);
    handleFileChangeRef.current = handleFileChange;

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            // Find the first image file and handle it
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        event.preventDefault();
                        handleFileChangeRef.current(file);
                        return; // Only handle the first image
                    }
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);
    
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    };

    const handleDownload = () => {
        if (history.length === 0) return;
        const link = document.createElement('a');
        link.download = 'retouched-image.png';
        link.href = history[historyIndex];
        link.click();
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
    
    const isEdited = history.length > 1;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white">
            <h1 className="text-3xl font-bold mb-2">AI Face Retouch</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-3xl">Upload a portrait to review, then use our AI tools to enhance skin, whiten teeth, and remove blemishes with professional, natural-looking results.</p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg shadow-lg">
                {!originalImage ? (
                     <div 
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center transition-colors hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {isDragging && (
                            <div className="absolute inset-0 bg-slate-200/90 dark:bg-slate-700/90 z-10 flex flex-col items-center justify-center rounded-lg border-indigo-500">
                                <ArrowUpTrayIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                                <p className="text-lg font-semibold text-slate-800 dark:text-white mt-2">Drop your portrait</p>
                            </div>
                        )}
                        <PhotoIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                         <input
                            type="file"
                            id="face-retouch-upload"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            accept="image/png, image/jpeg, image/webp"
                        />
                        <label htmlFor="face-retouch-upload" className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition-colors">
                            Upload Portrait
                        </label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">or drag & drop or paste</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Image Viewer */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-slate-200 dark:bg-slate-900 rounded-lg flex items-center justify-center relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
                                        <Loader large />
                                        <p className="text-white mt-4">{loadingMessage}</p>
                                    </div>
                                )}
                                {history.length > 0 && (
                                    isEdited ? (
                                        <ReactCompareImage 
                                            leftImage={originalImage.url} 
                                            rightImage={history[historyIndex]}
                                        />
                                    ) : (
                                        <img src={history[historyIndex]} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />
                                    )
                                )}
                            </div>
                            {error && <p className="text-red-500 dark:text-red-400 text-center text-sm">{error}</p>}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={handleDownload}
                                    disabled={history.length === 0 || isLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md flex items-center justify-center gap-2 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    <DownloadIcon className="w-5 h-5" /> Download
                                </button>
                                <label htmlFor="face-retouch-upload-new" className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold py-2 px-6 rounded-md transition-colors">
                                    Upload New
                                </label>
                                <input
                                    type="file"
                                    id="face-retouch-upload-new"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                    accept="image/png, image/jpeg, image/webp"
                                />
                            </div>
                        </div>
                        {/* Right Column: Controls */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                                    History
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleUndo} disabled={historyIndex === 0 || isLoading} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md disabled:opacity-50"><UndoIcon className="w-5 h-5" /></button>
                                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || isLoading} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md disabled:opacity-50"><RedoIcon className="w-5 h-5" /></button>
                                    </div>
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Step {historyIndex + 1} of {history.length}</p>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Automatic</h3>
                                <button
                                    onClick={() => handleRetouch(
                                        "Subtly enhance and retouch the photo. Improve lighting, contrast, and color balance; apply gentle sharpening; and perform minor, professional-grade skin retouching.", 
                                        'Auto-enhancing...'
                                    )}
                                    disabled={isLoading}
                                    className="w-full text-left p-4 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-4 transition-colors disabled:opacity-50"
                                >
                                    <SparklesIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">Auto-Enhance</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">One-click professional polish.</p>
                                    </div>
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Manual Retouch</h3>
                                <div className="space-y-3">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <p className="font-bold mb-2 flex items-center gap-2"><MagicWandIcon className="w-5 h-5 text-pink-500 dark:text-pink-400"/> Smooth Skin</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button onClick={() => handleRetouch('Smooth the skin with a subtle, light touch.', 'Applying subtle smoothing...')} disabled={isLoading} className="text-sm py-2 px-3 bg-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md disabled:opacity-50 transition-colors">Subtle</button>
                                            <button onClick={() => handleRetouch('Smooth the skin with a medium, balanced intensity.', 'Applying medium smoothing...')} disabled={isLoading} className="text-sm py-2 px-3 bg-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md disabled:opacity-50 transition-colors">Medium</button>
                                            <button onClick={() => handleRetouch('Smooth the skin with a strong, noticeable effect.', 'Applying strong smoothing...')} disabled={isLoading} className="text-sm py-2 px-3 bg-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md disabled:opacity-50 transition-colors">Strong</button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <p className="font-bold mb-2 flex items-center gap-2"><ArrowPathIcon className="w-5 h-5 text-purple-500 dark:text-purple-400"/> Wrinkle Reduction</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button onClick={() => handleRetouch('Subtly reduce the appearance of fine lines and wrinkles for a smoother look, while maintaining natural skin texture.', 'Applying subtle wrinkle reduction...')} disabled={isLoading} className="text-sm py-2 px-3 bg-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md disabled:opacity-50 transition-colors">Subtle</button>
                                            <button onClick={() => handleRetouch('Reduce the appearance of wrinkles with a medium, balanced intensity.', 'Applying medium wrinkle reduction...')} disabled={isLoading} className="text-sm py-2 px-3 bg-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md disabled:opacity-50 transition-colors">Medium</button>
                                            <button onClick={() => handleRetouch('Significantly reduce the appearance of deep-set wrinkles for a very smooth finish.', 'Applying strong wrinkle reduction...')} disabled={isLoading} className="text-sm py-2 px-3 bg-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md disabled:opacity-50 transition-colors">Strong</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                         <button onClick={() => handleRetouch('Naturally and subtly whiten the teeth.', 'Whitening teeth...')} disabled={isLoading} className="p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition-colors"><FaceSmileIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400"/> Whiten Teeth</button>
                                         <button onClick={() => handleRetouch('Remove any minor, temporary blemishes like pimples from the skin.', 'Removing blemishes...')} disabled={isLoading} className="p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition-colors"><BackspaceIcon className="w-5 h-5 text-red-500 dark:text-red-400"/> Remove Blemishes</button>
                                         <button onClick={() => handleRetouch('Sharpen and add clarity to the eyes, focusing on the iris and eyelashes.', 'Sharpening eyes...')} disabled={isLoading} className="p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition-colors"><EyeIcon className="w-5 h-5 text-blue-500 dark:text-blue-400"/> Sharpen Eyes</button>
                                         <button onClick={() => handleRetouch('Add a healthy, subtle radiance and glow to the skin.', 'Adding radiance...')} disabled={isLoading} className="p-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition-colors"><SunIcon className="w-5 h-5 text-orange-500 dark:text-orange-400"/> Add Radiance</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-8 text-center">
                 <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300">
                    &larr; Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default FaceRetouchPage;
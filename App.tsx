import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import { CameraIcon, MagicWandIcon, SwatchIcon, FaceSmileIcon, ArrowRightIcon, DownloadIcon, UndoIcon, RedoIcon, CropIcon, CheckIcon, XMarkIcon, SparklesIcon, PaintBrushIcon, EyeIcon, ArrowsRightLeftIcon, ClipboardIcon, EyeDropperIcon, BackspaceIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon, EraserIcon, TShirtIcon, ArrowsPointingOutIcon, ArrowUpTrayIcon, BookmarkIcon, TrashIcon, LockClosedIcon, LightBulbIcon } from './components/IconComponents';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import ReactCompareImage from 'react-compare-image';
import { useGeminiService } from './services/geminiService';
import Loader from './components/Loader';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import ImageToText from './components/ImageToText';
import { supabase } from './components/supabaseClient';
import EditorPage from './EditorPage';
import FaceRetouchPage from './components/FaceRetouchPage';
import ContactModal from './components/ContactModal';
import DeveloperPage from './components/DeveloperPage';
import WhyFeasiPix from './components/WhyFeasiPix';
import CommunityPage from './components/CommunityPage';


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

function LandingPage({ onStartEditing, onQuickEnhance, onStartEditingWithFile }: { onStartEditing: () => void; onQuickEnhance: (file: File) => void; onStartEditingWithFile: (file: File) => void; }) {
  const quickEnhanceInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const landingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (landingRef.current) {
            const { clientX, clientY } = e;
            requestAnimationFrame(() => {
                if (landingRef.current) {
                    landingRef.current.style.setProperty('--mouse-x', `${clientX}px`);
                    landingRef.current.style.setProperty('--mouse-y', `${clientY}px`);
                }
            });
        }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handlePaste = (event: ClipboardEvent) => {
        if (isDragging) return; // Prevent paste during drag-drop
        const items = event.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
                    if (validTypes.includes(file.type)) {
                        onStartEditingWithFile(file);
                    } else {
                        alert("Invalid file type. Please paste a PNG, JPG, or WEBP image.");
                    }
                    event.preventDefault();
                    return;
                }
            }
        }
    };
    document.addEventListener('paste', handlePaste);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('paste', handlePaste);
    }
  }, [onStartEditingWithFile, isDragging]);

  const handleQuickEnhanceClick = () => {
    quickEnhanceInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onQuickEnhance(file);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
        setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
          if (validTypes.includes(file.type)) {
              onStartEditingWithFile(file);
          } else {
              alert("Invalid file type. Please upload a PNG, JPG, or WEBP image.");
          }
      }
  };

  const creativeTools = [
    "Adventure Generator", "Face to Sticker", "Logo Generator", "Re-Imagine",
    "Age Journey", "Ghiblify", "AI Model Shoot", "Signature Generator",
    "Age Predictor", "Hair Style", "Mascot Generator", "Sticker Generator",
    "Avatar Generator", "Icon Generator", "Multiple Views", "SVG Generator",
    "Baby Generator", "Iconic Locations", "Pixel Perfect", "Tinder Profile Photos",
    "Background Remover", "Ideogram", "Photo Generator", "3D Object Generator",
    "Become Image", "Image Colorizer", "Portrait Series", "Product Photography",
    "Brighten Image", "Image Upscale", "Professional Headshot", "Face Enhancer",
    "Image to AI Image", "Face Swap", "Image to 3D", "QR Code Generator"
  ];

  return (
    <div ref={landingRef} className="text-slate-800 dark:text-white landing-aurora-bg">
      <main className="relative z-10">
        {/* Hero Section */}
        <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative"
        >
            {isDragging && (
                <div className="absolute inset-0 bg-slate-200/90 dark:bg-slate-800/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center border-4 border-dashed border-indigo-500 rounded-2xl m-4 transition-opacity duration-300">
                    <ArrowUpTrayIcon className="w-20 h-20 text-indigo-500 dark:text-indigo-400" />
                    <p className="text-2xl font-semibold text-slate-800 dark:text-white mt-4">Drop image to start editing</p>
                </div>
            )}
            <section className="text-center py-20 px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 text-transparent bg-clip-text">
                Unleash Your Creativity with AI Photo Editing
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
                Transform your photos with simple text prompts. Change backgrounds, alter clothing, and enhance your images instantly while preserving the natural you.
              </p>
              <button
                onClick={onStartEditing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg"
              >
                Start Editing for Free
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
              </button>
            </section>
        </div>

        {/* Quick Enhance Section */}
        <section className="py-20 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto text-center px-4">
                <h2 className="text-3xl font-bold mb-4">Quick Enhance & Retouch</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                    Need a quick touch-up? Upload your photo and let our AI give it a professional polish in one click.
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl">
                    <button
                        onClick={handleQuickEnhanceClick}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg"
                    >
                        <SparklesIcon className="inline-block w-6 h-6 mr-3" />
                        Enhance & Retouch Photo
                    </button>
                    <input
                        type="file"
                        ref={quickEnhanceInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                    />
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features at Your Fingertips</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-md dark:shadow-none">
                <MagicWandIcon className="w-12 h-12 mx-auto text-indigo-500 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Editing</h3>
                <p className="text-slate-600 dark:text-slate-400">Simply describe the changes you want. "Change the background to a sunny beach" or "give me a red jacket."</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-md dark:shadow-none">
                <SwatchIcon className="w-12 h-12 mx-auto text-indigo-500 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Clothing & Scenery</h3>
                <p className="text-slate-600 dark:text-slate-400">Experiment with different outfits and backgrounds without affecting the main subject of your photo.</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-md dark:shadow-none">
                <FaceSmileIcon className="w-12 h-12 mx-auto text-indigo-500 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Face Preservation</h3>
                <p className="text-slate-600 dark:text-slate-400">Our core technology ensures your face and skin tone remain completely unchanged and natural.</p>
              </div>
            </div>
          </div>
        </section>

         {/* Creative Tools Showcase Section */}
         <section className="py-20 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-4">A Universe of Creative Tools</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-3xl mx-auto">
              From professional headshots and product photography to imaginative avatars and face swaps, the creative possibilities are endless.
            </p>
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6 text-slate-600 dark:text-slate-300">
                {creativeTools.map(tool => (
                  <div key={tool} className="text-left hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Vision Section */}
        <section className="py-20">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Our Vision: Creativity, Uncomplicated.</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
                        We're breaking down the barriers of complex software to empower everyone to bring their ideas to life, regardless of technical skill.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="group relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:-translate-y-1">
                        <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-8 h-full">
                            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <LockClosedIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Breaking Barriers</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Traditional editing tools are complex. We replace steep learning curves with intuitive AI, unlocking professional-grade results for everyone.
                            </p>
                        </div>
                    </div>
                    {/* Card 2 */}
                    <div className="group relative p-1 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/30 transform hover:-translate-y-1">
                        <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-8 h-full">
                            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <LightBulbIcon className="w-8 h-8 text-pink-500 dark:text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Democratizing Creativity</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                We believe creativity is universal. Our mission is to give you the power to express your vision without needing to be a technical expert.
                            </p>
                        </div>
                    </div>
                    {/* Card 3 */}
                    <div className="group relative p-1 rounded-2xl bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 transform hover:-translate-y-1">
                        <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-8 h-full">
                            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <EyeIcon className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Focus on Your Vision</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Let our AI handle the complex tasks. You focus on what truly matters: exploring ideas and bringing your imagination to life.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>
      <style>{`
        .landing-aurora-bg::before {
            content: "";
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            background: radial-gradient(
                800px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
                rgba(79, 70, 229, 0.1), /* Indigo */
                rgba(219, 39, 119, 0.1), /* Pink */
                transparent 80%
            );
            opacity: 0;
            transition: opacity 0.5s ease;
        }

        .landing-aurora-bg:hover::before {
            opacity: 1;
        }
      `}</style>
    </div>
  );
}



function Footer({ onContactClick, onNavigate }: { onContactClick: () => void; onNavigate: (view: View) => void; }) {
  return (
    <footer className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 mt-12 relative z-10">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-slate-500 dark:text-slate-400">
        <p className="mb-2">&copy; 2025 FeasiPix by GHD codes. All rights reserved.</p>
        <div className="flex justify-center items-center gap-4">
            <button onClick={onContactClick} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                Contact Us
            </button>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <button onClick={() => onNavigate('developer')} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                Developer
            </button>
        </div>
      </div>
    </footer>
  );
}

type View = 'landing' | 'dashboard' | 'editor' | 'auth' | 'profile' | 'imageToText' | 'faceRetouch' | 'developer' | 'whyFeasiPix' | 'community';

function App() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [isQuickEnhance, setIsQuickEnhance] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Rule 1: If the user is NOT logged in...
    if (!session) {
      // ...and they try to access a protected page...
      const protectedViews: View[] = ['editor', 'profile', 'dashboard', 'imageToText', 'faceRetouch', 'developer', 'whyFeasiPix', 'community'];
      if (protectedViews.includes(view)) {
        // ...force them to the authentication page.
        setView('auth');
      }
    } 
    // Rule 2: If the user IS logged in...
    else {
      // ...and they are on a public page (e.g., after login, or visiting the landing page)...
      if (view === 'auth' || view === 'landing') {
        // ...send them to their dashboard.
        setView('dashboard');
      }
    }
  }, [view, session, loading]);
  
  const handleNavigate = (newView: View) => {
    setView(newView);
  };

  const handleStartEditing = () => {
    setInitialFile(null);
    setIsQuickEnhance(false);
    handleNavigate('editor');
  };

  const handleStartEditingWithFile = (file: File) => {
    setInitialFile(file);
    setIsQuickEnhance(false);
    handleNavigate('editor');
  }
  
  const handleQuickEnhance = (file: File) => {
    setInitialFile(file);
    setIsQuickEnhance(true);
    handleNavigate('editor');
  };

  const handleOpenContactModal = () => setIsContactModalOpen(true);
  const handleCloseContactModal = () => setIsContactModalOpen(false);

  const renderContent = () => {
    // Show a global loader only on the initial app load.
    if (loading && !session) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <Loader large />
        </div>
      );
    }

    switch(view) {
      case 'landing':
        return <LandingPage onStartEditing={handleStartEditing} onQuickEnhance={handleQuickEnhance} onStartEditingWithFile={handleStartEditingWithFile} />;
      case 'dashboard':
        return <Dashboard onNavigate={(newView) => handleNavigate(newView as View)} onQuickEnhance={handleQuickEnhance} onContactClick={handleOpenContactModal} />;
      case 'editor':
        return <EditorPage initialFile={initialFile} isQuickEnhance={isQuickEnhance} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'auth':
        return <Auth onAuthenticated={() => handleNavigate('dashboard')} />;
      case 'profile':
        return <Profile onBack={() => handleNavigate('dashboard')} onContactClick={handleOpenContactModal} onNavigate={handleNavigate} />;
      case 'imageToText':
        return <ImageToText onBack={() => handleNavigate('dashboard')} />;
      case 'faceRetouch':
        return <FaceRetouchPage onBack={() => handleNavigate('dashboard')} />;
      case 'developer':
        return <DeveloperPage onBack={() => handleNavigate('dashboard')} />;
      case 'whyFeasiPix':
        return <WhyFeasiPix onBack={() => handleNavigate('dashboard')} />;
      case 'community':
        return <CommunityPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onStartEditing={handleStartEditing} onQuickEnhance={handleQuickEnhance} onStartEditingWithFile={handleStartEditingWithFile} />;
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen flex flex-col transition-colors duration-300">
      <Header onNavigate={handleNavigate} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer onContactClick={handleOpenContactModal} onNavigate={handleNavigate} />
      <ContactModal isOpen={isContactModalOpen} onClose={handleCloseContactModal} />
    </div>
  );
}

export default App;
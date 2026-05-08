import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraIcon, MagicWandIcon, SwatchIcon, FaceSmileIcon, ArrowRightIcon, DownloadIcon, UndoIcon, RedoIcon, CropIcon, CheckIcon, XMarkIcon, SparklesIcon, PaintBrushIcon, EyeIcon, ArrowsRightLeftIcon, ClipboardIcon, EyeDropperIcon, BackspaceIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon, EraserIcon, TShirtIcon, ArrowsPointingOutIcon, ArrowUpTrayIcon, BookmarkIcon, TrashIcon, LockClosedIcon, LightBulbIcon, PencilIcon, ShareIcon } from './components/IconComponents';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import ReactCompareImage from 'react-compare-image';
import { useGeminiService } from './services/geminiService';
import Loader from './components/Loader';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './components/supabaseClient';

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

// Helper to convert data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
}

interface Preset {
  id?: string;
  name: string;
  settings: {
    filter: string;
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    highlights: { color: string; intensity: number };
    shadows: { color: string; intensity: number };
  };
}

interface EditorPageProps {
    initialFile: File | null;
    isQuickEnhance: boolean;
    onBack: () => void;
    onNavigate: (view: any) => void;
}

export default function EditorPage({ initialFile, isQuickEnhance, onBack, onNavigate }: EditorPageProps) {
  const { session } = useAuth();
  const [originalImages, setOriginalImages] = useState<{ url: string; file: File; }[]>([]);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { editImage, getBackgroundIdeas, enhanceImage, removeObject } = useGeminiService();
  const [backgroundIdeas, setBackgroundIdeas] = useState<string[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Filter & Adjustment states
  const [filterHistory, setFilterHistory] = useState<string[]>(['none']);
  const [filterHistoryIndex, setFilterHistoryIndex] = useState(0);
  const selectedFilter = filterHistory[filterHistoryIndex];
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);

  // Color Grading states
  const [highlights, setHighlights] = useState({ color: '#ffffff', intensity: 0 });
  const [shadows, setShadows] = useState({ color: '#000000', intensity: 0 });

  // Preset states
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [editingPresetName, setEditingPresetName] = useState('');

  // Cropping states
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Color Picker states
  const [isColorPicking, setIsColorPicking] = useState(false);
  const [pickedColor, setPickedColor] = useState<{ hex: string; rgb: string } | null>(null);

  // Portrait Enhancement states
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [showHairColorInput, setShowHairColorInput] = useState(false);
  const [showEyeColorInput, setShowEyeColorInput] = useState(false);

  // Clothing Changer states
  const [clothingPrompt, setClothingPrompt] = useState('');
  const [showClothingInput, setShowClothingInput] = useState(false);

  // Before & After slider state
  const [showCompare, setShowCompare] = useState(false);

  // Inpainting/Object Removal states
  const [isMasking, setIsMasking] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPositionRef = useRef<{ x: number, y: number } | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [brushHardness, setBrushHardness] = useState(0.5); // Range 0 (soft) to 1 (hard)
  const [isErasing, setIsErasing] = useState(false);
  const [brushCursorPosition, setBrushCursorPosition] = useState<{ x: number, y: number } | null>(null);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isLargeView, setIsLargeView] = useState(false);
  
  // Drag & Drop state
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const dragUploadCounter = useRef(0);

  // Community Share states
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLargeView(false);
      }
    };

    if (isLargeView) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLargeView]);

  useEffect(() => {
    const fetchPresets = async () => {
      if (!session?.user) {
        setPresets([]);
        return;
      };
      try {
        const { data, error } = await supabase
          .from('presets')
          .select('id, name, settings')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) setPresets(data as Preset[]);

      } catch (err: any) {
        setError(`Could not load presets: ${err.message}`);
      }
    };
    fetchPresets();
  }, [session]);

  const processInitialFile = useCallback(async (file: File, shouldEnhance: boolean) => {
    const newImage = { url: URL.createObjectURL(file), file };
    resetState();
    setOriginalImages([newImage]);

    if (shouldEnhance) {
      try {
          setIsLoading(true);
          setError(null);
          const base64 = await fileToBase64(file);
          const enhancedBase64 = await enhanceImage([base64], [file.type]);
          setEditedImageUrl(`data:image/png;base64,${enhancedBase64}`);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred during quick enhance.');
      } finally {
          setIsLoading(false);
      }
    }
  }, [enhanceImage]);

  React.useEffect(() => {
    if (initialFile) {
        processInitialFile(initialFile, isQuickEnhance);
    }
  }, [initialFile, isQuickEnhance, processInitialFile]);

  const handleAddFiles = (files: File[]) => {
      setError(null);
      const MAX_FILES = 3;
      const MAX_SIZE_MB = 10;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

      if (originalImages.length + files.length > MAX_FILES) {
          setError(`You can upload a maximum of ${MAX_FILES} images.`);
          return;
      }
      
      const newImages = [];
      for (const file of files) {
          if (!allowedTypes.includes(file.type)) {
              setError(`Invalid file type: ${file.name}. Please use PNG, JPG, or WEBP.`);
              return; 
          }
          if (file.size > MAX_SIZE_BYTES) {
              setError(`File is too large: ${file.name}. Maximum size is ${MAX_SIZE_MB}MB.`);
              return;
          }
          newImages.push({
              url: URL.createObjectURL(file),
              file,
          });
      }

      if (originalImages.length === 0 && newImages.length > 0) {
        resetState();
      }

      setOriginalImages(prev => [...prev, ...newImages]);
  };
  
    const handleAddFilesRef = useRef(handleAddFiles);
    handleAddFilesRef.current = handleAddFiles;

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                return;
            }

            const items = event.clipboardData?.items;
            if (!items) return;

            const imageFiles: File[] = [];
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        imageFiles.push(file);
                    }
                }
            }

            if (imageFiles.length > 0) {
                event.preventDefault();
                handleAddFilesRef.current(imageFiles);
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleAddFiles(Array.from(event.target.files));
      event.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setOriginalImages(prev => {
        const newImages = prev.filter((_, index) => index !== indexToRemove);
        // If all images are removed, reset the editor state
        if (newImages.length === 0) {
            resetState();
        }
        return newImages;
    });
  };
  
  const resetColorGrading = () => {
    setHighlights({ color: '#ffffff', intensity: 0 });
    setShadows({ color: '#000000', intensity: 0 });
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHue(0);
    resetColorGrading();
  };
  
  const resetFilters = () => {
    setFilterHistory(['none']);
    setFilterHistoryIndex(0);
  };

  const resetAllImageSettings = () => {
    resetFilters();
    resetAdjustments();
  };

  const handleGenerate = async () => {
    if (originalImages.length === 0 || !prompt.trim()) {
      setError('Please upload at least one image and enter a prompt.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setBackgroundIdeas([]);
    setEditedImageUrl(null);
    setShareSuccess(false);
    resetAllImageSettings();
    try {
        const base64Images = await Promise.all(originalImages.map(img => fileToBase64(img.file)));
        const mimeTypes = originalImages.map(img => img.file.type);
        const editedImageBase64 = await editImage(base64Images, mimeTypes, prompt);
        setEditedImageUrl(`data:image/png;base64,${editedImageBase64}`);

        if (prompt.toLowerCase().includes('background')) {
            setIsLoadingIdeas(true);
            try {
            const ideas = await getBackgroundIdeas(prompt);
            setBackgroundIdeas(ideas);
            } catch (ideaError) {
            console.error("Could not fetch background ideas:", ideaError);
            } finally {
            setIsLoadingIdeas(false);
            }
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRegenerateWithIdea = async (idea: string) => {
    if (originalImages.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);
    setShareSuccess(false);
    resetAllImageSettings();
    try {
        const base64Images = await Promise.all(originalImages.map(img => fileToBase64(img.file)));
        const mimeTypes = originalImages.map(img => img.file.type);
        const editedImageBase64 = await editImage(base64Images, mimeTypes, idea);
        setEditedImageUrl(`data:image/png;base64,${editedImageBase64}`);
        setPrompt(idea); 
        setBackgroundIdeas([]);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during regeneration.');
    } finally {
        setIsLoading(false);
    }
  };

  const resetState = () => {
    setOriginalImages([]);
    setEditedImageUrl(null);
    setPrompt('');
    setIsLoading(false);
    setError(null);
    setBackgroundIdeas([]);
    setIsLoadingIdeas(false);
    resetAllImageSettings();
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCroppedImageUrl(null);
    setIsEnhancing(false);
    setIsColorPicking(false);
    setPickedColor(null);
    setShowCompare(false);
    setIsMasking(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setClothingPrompt('');
    setShowClothingInput(false);
    setIsSharing(false);
    setShareSuccess(false);
  };

  const applyFilter = (filter: string) => {
    const newHistory = filterHistory.slice(0, filterHistoryIndex + 1);
    newHistory.push(filter);
    setFilterHistory(newHistory);
    setFilterHistoryIndex(newHistory.length - 1);
  };

  const handleUndoFilter = () => {
    if (filterHistoryIndex > 0) {
      setFilterHistoryIndex(filterHistoryIndex - 1);
    }
  };

  const handleRedoFilter = () => {
    if (filterHistoryIndex < filterHistory.length - 1) {
      setFilterHistoryIndex(filterHistoryIndex + 1);
    }
  };
  
  const getImageStyle = () => {
    const filters: string[] = [];
    if (selectedFilter === 'grayscale') filters.push('grayscale(1)');
    if (selectedFilter === 'sepia') filters.push('sepia(1)');
    if (selectedFilter === 'vintage') {
        filters.push('contrast(1.25)');
        filters.push('brightness(0.9)');
        filters.push('sepia(0.25)');
    }

    filters.push(`brightness(${brightness / 100})`);
    filters.push(`contrast(${contrast / 100})`);
    filters.push(`saturate(${saturation / 100})`);
    filters.push(`hue-rotate(${hue}deg)`);
    
    return { filter: filters.join(' ') };
  };

  const handleDownload = () => {
    const imageUrlToDownload = croppedImageUrl || editedImageUrl;
    if (!imageUrlToDownload || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const style = getImageStyle();
        if (style.filter) {
            ctx.filter = style.filter;
        }

        ctx.drawImage(image, 0, 0);

        // Apply color grading overlays
        if (highlights.intensity > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = highlights.intensity / 100;
            ctx.fillStyle = highlights.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (shadows.intensity > 0) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = shadows.intensity / 100;
            ctx.fillStyle = shadows.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Reset for download link
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    image.src = imageUrlToDownload;
  };
  
  const handleConfirmCrop = () => {
    if (!completedCrop || !imageRef.current) return;
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    const url = canvas.toDataURL('image/png');
    setCroppedImageUrl(url);
    setEditedImageUrl(url); 
    setIsCropping(false);
  };

  const getAiActionPayload = async (primaryImageUrl: string) => {
    // Convert primary image URL to base64
    const fetchRes = await fetch(primaryImageUrl);
    const blob = await fetchRes.blob();
    const file = new File([blob], "image_to_edit.png", { type: blob.type });
    const primaryBase64 = await fileToBase64(file);
    const primaryMimeType = file.type;

    // Get base64 for original reference images (skipping the first one which was edited)
    const referenceImages = originalImages.slice(1);
    const referenceBase64 = await Promise.all(referenceImages.map(img => fileToBase64(img.file)));
    const referenceMimeTypes = referenceImages.map(img => img.file.type);

    return {
        allBase64: [primaryBase64, ...referenceBase64],
        allMimeTypes: [primaryMimeType, ...referenceMimeTypes]
    }
  }
  
  const handleEnhance = async () => {
    const imageToEnhanceUrl = croppedImageUrl || editedImageUrl;
    if (!imageToEnhanceUrl) return;
    
    setIsEnhancing(true);
    setError(null);
    try {
        const { allBase64, allMimeTypes } = await getAiActionPayload(imageToEnhanceUrl);
        const enhancedBase64 = await enhanceImage(allBase64, allMimeTypes);

        const newImageUrl = `data:image/png;base64,${enhancedBase64}`;
        setEditedImageUrl(newImageUrl);
        if (croppedImageUrl) {
            setCroppedImageUrl(newImageUrl);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during enhancement.');
    } finally {
        setIsEnhancing(false);
    }
  };
  
  const handleImageClickForPicker = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isColorPicking || !imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const image = imageRef.current;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = image.naturalWidth / image.getBoundingClientRect().width;
    const scaleY = image.naturalHeight / image.getBoundingClientRect().height;

    const pixelData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];

    const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
    
    setPickedColor({
      rgb: `rgb(${r}, ${g}, ${b})`,
      hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`
    });
    setIsColorPicking(false);
  };
  
  const handlePortraitEnhancement = async (enhancementType: 'hair' | 'eyes' | 'smile') => {
    const imageUrl = croppedImageUrl || editedImageUrl;
    if (!imageUrl) return;

    let enhancementPrompt = '';
    switch (enhancementType) {
        case 'hair':
            if (!hairColor.trim()) { setError('Please enter a hair color.'); return; }
            enhancementPrompt = `Change the subject's hair color to ${hairColor}.`;
            break;
        case 'eyes':
            if (!eyeColor.trim()) { setError('Please enter an eye color.'); return; }
            enhancementPrompt = `Change the subject's eye color to ${eyeColor}.`;
            break;
        case 'smile':
            enhancementPrompt = 'Subtly and naturally add a gentle, happy smile to the subject\'s face.';
            break;
        default:
            return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        const { allBase64, allMimeTypes } = await getAiActionPayload(imageUrl);
        const editedImageBase64 = await editImage(allBase64, allMimeTypes, enhancementPrompt);
        
        const newImageUrl = `data:image/png;base64,${editedImageBase64}`;
        setEditedImageUrl(newImageUrl);
        if (croppedImageUrl) {
            setCroppedImageUrl(newImageUrl);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during portrait enhancement.');
    } finally {
        setIsLoading(false);
        setShowHairColorInput(false);
        setShowEyeColorInput(false);
    }
  };

  const handleClothingChange = async () => {
    const imageUrl = croppedImageUrl || editedImageUrl;
    if (!imageUrl || !clothingPrompt.trim()) {
      setError('Please enter a clothing description.');
      return;
    }
  
    setIsLoading(true);
    setError(null);
    try {
        const { allBase64, allMimeTypes } = await getAiActionPayload(imageUrl);
        const fullPrompt = `Change the subject's clothing to: ${clothingPrompt}.`;
        const editedImageBase64 = await editImage(allBase64, allMimeTypes, fullPrompt);
        
        const newImageUrl = `data:image/png;base64,${editedImageBase64}`;
        setEditedImageUrl(newImageUrl);
        if (croppedImageUrl) {
            setCroppedImageUrl(newImageUrl);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during the clothing change.');
    } finally {
        setIsLoading(false);
        setShowClothingInput(false);
        setClothingPrompt('');
    }
  };

    // --- MASKING / INPAINTING LOGIC ---
    useEffect(() => {
        const canvas = maskCanvasRef.current;
        const image = imageRef.current;
        if (isMasking && canvas && image) {
            const imageRect = image.getBoundingClientRect();
            canvas.width = imageRect.width;
            canvas.height = imageRect.height;
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [isMasking]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>): { x: number, y: number } | null => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const drawBrushPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
        ctx.beginPath();
        if (isErasing) {
            ctx.fillStyle = 'white'; // Color does not matter for destination-out
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 2);
            const brushColor = 'rgba(239, 68, 68, 0.7)'; // red-500 with opacity
            gradient.addColorStop(0, brushColor);
            gradient.addColorStop(brushHardness, brushColor);
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = gradient;
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
        const coords = getCoords(e);
        if (coords) {
            isDrawingRef.current = true;
            const ctx = maskCanvasRef.current?.getContext('2d');
            if (ctx) {
                drawBrushPoint(ctx, coords.x, coords.y);
            }
            lastPositionRef.current = coords;
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const coords = getCoords(e);
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (coords && ctx && lastPositionRef.current) {
            const dist = Math.hypot(coords.x - lastPositionRef.current.x, coords.y - lastPositionRef.current.y);
            const angle = Math.atan2(coords.y - lastPositionRef.current.y, coords.x - lastPositionRef.current.x);
            const step = Math.min(4, brushSize / 4);

            for (let i = 0; i < dist; i += step) {
                const x = lastPositionRef.current.x + Math.cos(angle) * i;
                const y = lastPositionRef.current.y + Math.sin(angle) * i;
                drawBrushPoint(ctx, x, y);
            }
            drawBrushPoint(ctx, coords.x, coords.y);
            lastPositionRef.current = coords;
        }
    };
    
    const stopDrawing = () => { isDrawingRef.current = false; lastPositionRef.current = null; };
    const handleCancelRemoval = () => setIsMasking(false);

    const handleConfirmRemoval = async () => {
        const canvas = maskCanvasRef.current;
        const imageUrlToRemoveFrom = croppedImageUrl || editedImageUrl || (originalImages.length > 0 ? originalImages[0].url : null);
        if (!canvas || !imageUrlToRemoveFrom) return;
        
        setIsLoading(true);
        setError(null);
        setIsMasking(false);

        try {
            // Get primary image
            const fetchRes = await fetch(imageUrlToRemoveFrom);
            const blob = await fetchRes.blob();
            const file = new File([blob], "image_for_removal.png", { type: blob.type });
            const imageBase64 = await fileToBase64(file);
            const imageMimeType = file.type;

            // Create mask
            const maskProcessingCanvas = document.createElement('canvas');
            const tempImage = new Image();
            tempImage.src = imageUrlToRemoveFrom;
            await new Promise(resolve => tempImage.onload = resolve);
            maskProcessingCanvas.width = tempImage.naturalWidth;
            maskProcessingCanvas.height = tempImage.naturalHeight;
            const ctx = maskProcessingCanvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context for mask.");
            ctx.drawImage(canvas, 0, 0, tempImage.naturalWidth, tempImage.naturalHeight);
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, tempImage.naturalWidth, tempImage.naturalHeight);
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, tempImage.naturalWidth, tempImage.naturalHeight);
            const maskBase64 = maskProcessingCanvas.toDataURL('image/png').split(',')[1];
            
            // Get reference images
            const referenceImages = originalImages.slice(1);
            const referenceBase64 = await Promise.all(referenceImages.map(img => fileToBase64(img.file)));
            const referenceMimeTypes = referenceImages.map(img => img.file.type);
            
            const resultBase64 = await removeObject(imageBase64, imageMimeType, maskBase64, referenceBase64, referenceMimeTypes);
            const newImageUrl = `data:image/png;base64,${resultBase64}`;
            setEditedImageUrl(newImageUrl);
            if (croppedImageUrl) {
                setCroppedImageUrl(newImageUrl);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during object removal.');
        } finally {
            setIsLoading(false);
        }
    };
  
    const handleStartMasking = () => {
        if (zoom !== 1 || pan.x !== 0 || pan.y !== 0) {
            setError("Please reset the image view (zoom and pan) before removing an object.");
            return;
        }
        setError(null);
        setIsMasking(true);
    };

    // --- ZOOM & PAN LOGIC ---
    const isEditingBusy = isLoading || isEnhancing;
    const isZoomPanDisabled = isCropping || isMasking || isEditingBusy;

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (isZoomPanDisabled) return;
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newZoom = Math.min(Math.max(zoom + scaleAmount, 0.5), 5);
        
        if (imageContainerRef.current) {
            const rect = imageContainerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const panX = pan.x - (mouseX - pan.x) * (newZoom - zoom) / zoom;
            const panY = pan.y - (mouseY - pan.y) * (newZoom - zoom) / zoom;
            
            setZoom(newZoom);
            setPan({ x: panX, y: panY });
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isZoomPanDisabled || e.button !== 0) return;
        e.preventDefault();
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning) return;
        e.preventDefault();
        setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    };

    const handleMouseUpOrLeave = () => {
        setIsPanning(false);
    };

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 5));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };
    
    // --- DRAG & DROP UPLOAD LOGIC ---
    const handleDragEnterUpload = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragUploadCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDraggingUpload(true);
        }
    };
    const handleDragLeaveUpload = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragUploadCounter.current--;
        if (dragUploadCounter.current === 0) {
            setIsDraggingUpload(false);
        }
    };
    const handleDragOverUpload = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDropUpload = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingUpload(false);
        dragUploadCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAddFiles(Array.from(e.dataTransfer.files));
        }
    };

    // --- PRESET LOGIC ---
    const handleStartSavePreset = () => {
      setIsSavingPreset(true);
      setNewPresetName('');
    };
  
    const handleCancelSavePreset = () => {
      setIsSavingPreset(false);
    };
  
    const handleConfirmSavePreset = async () => {
      if (!session?.user) {
        setError('You must be signed in to save presets.');
        return;
      }
      if (!newPresetName.trim()) {
        setError('Please enter a name for your preset.');
        return;
      }
      if (presets.some(p => p.name.toLowerCase() === newPresetName.trim().toLowerCase())) {
          setError('A preset with this name already exists.');
          return;
      }
      setError(null);
  
      const newPresetData = {
        user_id: session.user.id,
        name: newPresetName.trim(),
        settings: {
          filter: selectedFilter,
          brightness,
          contrast,
          saturation,
          hue,
          highlights,
          shadows,
        },
      };
  
      try {
        const { data, error } = await supabase.from('presets').insert(newPresetData).select().single();
        if (error) {
          if (error.code === '23505') { 
            throw new Error('A preset with this name already exists.');
          }
          throw error;
        }
        if (data) {
          setPresets([...presets, data as Preset]);
        }
        setIsSavingPreset(false);
      } catch (err: any) {
        setError(`Could not save preset: ${err.message}`);
      }
    };
  
    const handleApplyPreset = (preset: Preset) => {
        if (window.confirm(`Apply preset "${preset.name}"?\nThis will override your current image adjustments.`)) {
            const { settings } = preset;
            applyFilter(settings.filter);
            setBrightness(settings.brightness);
            setContrast(settings.contrast);
            setSaturation(settings.saturation);
            setHue(settings.hue);
            setHighlights(settings.highlights || { color: '#ffffff', intensity: 0 });
            setShadows(settings.shadows || { color: '#000000', intensity: 0 });
        }
    };
  
    const handleDeletePreset = async (preset: Preset) => {
      if (!preset.id) return;
      if (window.confirm(`Are you sure you want to delete the preset "${preset.name}"?`)) {
          try {
              const { error } = await supabase.from('presets').delete().eq('id', preset.id);
              if (error) throw error;
              setPresets(presets.filter(p => p.id !== preset.id));
          } catch (err: any) {
              setError(`Could not delete preset: ${err.message}`);
          }
      }
    };

    const handleStartEditPreset = (preset: Preset) => {
        setEditingPreset(preset);
        setEditingPresetName(preset.name);
    };

    const handleCancelEditPreset = () => {
        setEditingPreset(null);
        setEditingPresetName('');
        setError(null);
    };

    const handleConfirmEditPreset = async () => {
        if (!editingPreset || !editingPresetName.trim()) {
            setError('Preset name cannot be empty.');
            return;
        }
        if (presets.some(p => p.id !== editingPreset.id && p.name.toLowerCase() === editingPresetName.trim().toLowerCase())) {
            setError('A preset with this name already exists.');
            return;
        }
        setError(null);

        try {
            const { error } = await supabase
                .from('presets')
                .update({ name: editingPresetName.trim() })
                .eq('id', editingPreset.id);

            if (error) throw error;

            setPresets(presets.map(p =>
                p.id === editingPreset.id ? { ...p, name: editingPresetName.trim() } : p
            ));
            handleCancelEditPreset();
        } catch (err: any) {
            setError(`Could not update preset: ${err.message}`);
        }
    };
    
    // --- COMMUNITY SHARE LOGIC ---
    const handleShareToCommunity = async () => {
        if (!session?.user || originalImages.length === 0 || !editedImageUrl || !prompt) {
            setError("Cannot share. Ensure you are logged in and have an edited image and prompt.");
            return;
        }

        if (!window.confirm("Are you sure you want to share this creation to the public community showcase?")) {
            return;
        }

        setIsSharing(true);
        setError(null);
        setShareSuccess(false);

        try {
            const userId = session.user.id;
            const timestamp = Date.now();

            // 1. Upload original image
            const originalFile = originalImages[0].file;
            const originalPath = `public/${userId}/${timestamp}-original.png`;
            const { error: originalUploadError } = await supabase.storage
                .from('showcase-images')
                .upload(originalPath, originalFile);
            if (originalUploadError) throw originalUploadError;
            const { data: { publicUrl: original_image_url } } = supabase.storage.from('showcase-images').getPublicUrl(originalPath);

            // 2. Upload edited image
            const editedBlob = await dataUrlToBlob(editedImageUrl);
            const editedFile = new File([editedBlob], "edited.png", { type: "image/png" });
            const editedPath = `public/${userId}/${timestamp}-edited.png`;
            const { error: editedUploadError } = await supabase.storage
                .from('showcase-images')
                .upload(editedPath, editedFile);
            if (editedUploadError) throw editedUploadError;
            const { data: { publicUrl: edited_image_url } } = supabase.storage.from('showcase-images').getPublicUrl(editedPath);

            // 3. Insert into database
            const { error: insertError } = await supabase.from('community_showcase').insert({
                user_id: userId,
                prompt,
                original_image_url,
                edited_image_url,
            });
            if (insertError) throw insertError;
            
            setShareSuccess(true);
        } catch (err: any) {
            setError(`Failed to share: ${err.message}`);
        } finally {
            setIsSharing(false);
        }
    };


  const currentImage = croppedImageUrl || editedImageUrl || (originalImages.length > 0 ? originalImages[0].url : null);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white">
      <style>{`
        .react-compare-image__label-container .react-compare-image__label {
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem; /* rounded-md */
            font-size: 0.875rem; /* text-sm */
            font-weight: 600; /* font-semibold */
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column: Controls */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 dark:border-slate-600 pb-2">1. Upload Image</h2>
          {originalImages.length > 0 && (
            <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">Your Images ({originalImages.length}/3):</h3>
                <div className="grid grid-cols-3 gap-2">
                    {originalImages.map((image, index) => (
                        <div key={image.url} className="relative group aspect-square">
                            <img src={image.url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                            <button 
                                onClick={() => handleRemoveImage(index)} 
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                title="Remove image"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          )}
          {originalImages.length < 3 && (
            <div 
              onDragEnter={handleDragEnterUpload}
              onDragLeave={handleDragLeaveUpload}
              onDragOver={handleDragOverUpload}
              onDrop={handleDropUpload}
              className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDraggingUpload && (
                  <div className="absolute inset-0 bg-slate-200/90 dark:bg-slate-700/90 z-10 flex flex-col items-center justify-center rounded-lg border-indigo-500">
                      <ArrowUpTrayIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                      <p className="text-lg font-semibold text-slate-800 dark:text-white mt-2">Drop your image(s)</p>
                  </div>
              )}
              <CameraIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                multiple
              />
              <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300">
                {originalImages.length > 0 ? 'Add more files' : 'Choose files'}
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">or drag & drop, or paste image</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB. Max 3 images.</p>
            </div>
          )}
          {originalImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 dark:border-slate-600 pb-2">2. Describe Your Edit</h2>
              <textarea
                className="w-full h-24 p-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-md placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g., 'Change the background to a futuristic city at night' or 'Put me in a black leather jacket'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
              <button
                onClick={handleGenerate}
                disabled={originalImages.length === 0 || !prompt.trim() || isLoading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader /> : <><MagicWandIcon className="w-5 h-5 mr-2" /> Generate</>}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Image Display */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 border-b border-slate-300 dark:border-slate-600 pb-2">3. Result</h2>
          <div
             ref={imageContainerRef}
             onWheel={handleWheel}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUpOrLeave}
             onMouseLeave={handleMouseUpOrLeave}
             className={`aspect-square bg-slate-200 dark:bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden
             ${ !isZoomPanDisabled && !isColorPicking && currentImage ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}
             ${isColorPicking ? 'cursor-crosshair' : ''}
             ${isMasking ? 'cursor-none' : ''}
             `}
          >
            {currentImage ? (
                <div className='relative w-full h-full flex items-center justify-center'>
                    {isCropping ? (
                        <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={c => setCompletedCrop(c)}
                        >
                            <img ref={imageRef} src={currentImage} alt="To be cropped" className={`max-w-full max-h-full object-contain`} />
                        </ReactCrop>
                    ) : showCompare && originalImages.length > 0 && editedImageUrl ? (
                        <ReactCompareImage 
                            leftImage={originalImages[0].url} 
                            rightImage={currentImage}
                            leftImageLabel="Before"
                            rightImageLabel="After"
                            sliderLineColor="#4f46e5"
                            sliderLineWidth={3}
                            handle={
                                <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl border-2 border-white cursor-ew-resize group">
                                    <ArrowsRightLeftIcon className="w-6 h-6 text-indigo-600 transition-transform group-hover:scale-110" />
                                </div>
                            }
                        />
                    ) : (
                        <img
                            ref={imageRef}
                            src={currentImage}
                            alt={editedImageUrl ? 'Edited result' : 'Original upload'}
                            className={`max-w-none max-h-none`}
                            style={{
                                ...getImageStyle(),
                                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                transition: isPanning ? 'none' : 'transform 0.1s ease-out, filter 0.2s ease-in-out',
                            }}
                            onClick={isColorPicking ? handleImageClickForPicker : undefined}
                        />
                    )}
                    {/* Color Grading Overlays */}
                    {!isCropping && !showCompare && (
                        <>
                           <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: highlights.color, mixBlendMode: 'plus-lighter', opacity: highlights.intensity / 100 }} />
                           <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: shadows.color, mixBlendMode: 'multiply', opacity: shadows.intensity / 100 }} />
                        </>
                    )}
                    {isMasking && (
                        <>
                        <canvas
                            ref={maskCanvasRef}
                            className="absolute top-0 left-0 w-full h-full"
                            onMouseDown={startDrawing}
                            onMouseMove={e => {
                                const coords = getCoords(e);
                                if(coords) setBrushCursorPosition(coords);
                                draw(e);
                            }}
                            onMouseUp={stopDrawing}
                            onMouseLeave={() => {
                                stopDrawing();
                                setBrushCursorPosition(null);
                            }}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        {brushCursorPosition && (
                            <div
                                className="absolute pointer-events-none rounded-full"
                                style={{
                                    left: brushCursorPosition.x - brushSize / 2,
                                    top: brushCursorPosition.y - brushSize / 2,
                                    width: brushSize,
                                    height: brushSize,
                                    border: isErasing ? '2px solid white' : '2px solid transparent',
                                    backgroundColor: isErasing ? 'transparent' : 'rgba(239, 68, 68, 0.4)',
                                    boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                                }}
                            />
                        )}
                        </>
                    )}
                </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-500">Your edited image will appear here</p>
            )}
            {(isLoading || isEnhancing) && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                <Loader large />
                <p className="text-white mt-4">{isLoading ? 'Generating your image...' : isEnhancing ? 'Enhancing photo...' : 'Processing...'}</p>
              </div>
            )}
            {isMasking && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 rounded-lg flex items-center gap-4 shadow-lg text-slate-800 dark:text-white">
                    <div className="flex bg-slate-200 dark:bg-slate-700 rounded-md p-0.5">
                        <button onClick={() => setIsErasing(false)} title="Brush" className={`p-1.5 rounded-md transition-colors ${!isErasing ? 'bg-indigo-600 text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}><PaintBrushIcon className="w-5 h-5"/></button>
                        <button onClick={() => setIsErasing(true)} title="Eraser" className={`p-1.5 rounded-md transition-colors ${isErasing ? 'bg-indigo-600 text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}><EraserIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="brush-size" className="text-xs text-slate-600 dark:text-slate-300">Size</label>
                        <input id="brush-size" type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-24 accent-indigo-500"/>
                    </div>
                    {!isErasing && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="brush-hardness" className="text-xs text-slate-600 dark:text-slate-300">Hardness</label>
                            <input id="brush-hardness" type="range" min="0" max="1" step="0.05" value={brushHardness} onChange={(e) => setBrushHardness(Number(e.target.value))} className="w-24 accent-indigo-500"/>
                        </div>
                    )}
                </div>
            )}
            {currentImage && !isCropping && !isMasking && !showCompare && (
                 <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-1 rounded-md">
                     <button onClick={handleZoomIn} className="p-2 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"><MagnifyingGlassPlusIcon className="w-5 h-5" /></button>
                     <button onClick={handleZoomOut} className="p-2 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"><MagnifyingGlassMinusIcon className="w-5 h-5" /></button>
                     <button onClick={handleResetZoom} className="p-2 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"><ArrowPathIcon className="w-5 h-5" /></button>
                     <button onClick={() => setIsLargeView(true)} title="View large" className="p-2 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"><ArrowsPointingOutIcon className="w-5 h-5" /></button>
                 </div>
            )}
          </div>
          {error && <p className="text-red-500 dark:text-red-400 mt-4">{error}</p>}
          
          {editedImageUrl && (
            <div className="mt-4">
                 <div className="flex items-center gap-2 mb-4">
                    <button
                        onClick={handleShareToCommunity}
                        disabled={isSharing || shareSuccess || isEditingBusy}
                        className={`w-full font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
                        shareSuccess
                            ? 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-400 dark:disabled:bg-slate-600'
                        }`}
                    >
                        {isSharing ? (
                            <Loader />
                        ) : shareSuccess ? (
                            <><CheckIcon className="w-5 h-5 mr-2" /> Shared!</>
                        ) : (
                            <><ShareIcon className="w-5 h-5 mr-2" /> Share to Community</>
                        )}
                    </button>
                    {shareSuccess && (
                        <button
                            onClick={() => onNavigate('community')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors"
                        >
                            View in Showcase <ArrowRightIcon className="w-4 h-4 ml-2"/>
                        </button>
                    )}
                </div>

              {/* Action Buttons */}
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2 ${isMasking ? 'hidden' : ''}`}>
                  <button onClick={handleDownload} disabled={isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md flex flex-col items-center justify-center text-xs disabled:opacity-50 transition-colors"> <DownloadIcon className="w-5 h-5 mb-1" /> Download </button>
                  <button onClick={() => setIsCropping(true)} disabled={isEditingBusy || isCropping || showCompare} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md flex flex-col items-center justify-center text-xs disabled:opacity-50 transition-colors"> <CropIcon className="w-5 h-5 mb-1" /> Crop Image </button>
                  <button onClick={handleEnhance} disabled={isEditingBusy || showCompare} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md flex flex-col items-center justify-center text-xs disabled:opacity-50 transition-colors"> <SparklesIcon className="w-5 h-5 mb-1" /> Enhance </button>
                  <button onClick={() => setIsColorPicking(true)} disabled={isEditingBusy || showCompare} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md flex flex-col items-center justify-center text-xs disabled:opacity-50 transition-colors"> <EyeDropperIcon className="w-5 h-5 mb-1" /> Color Picker </button>
                  <button onClick={() => setShowCompare(!showCompare)} disabled={isEditingBusy} className={`p-2 rounded-md flex flex-col items-center justify-center text-xs transition-colors disabled:opacity-50 ${showCompare ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}> <ArrowsRightLeftIcon className="w-5 h-5 mb-1" /> {showCompare ? 'Exit Compare' : 'Compare'} </button>
                  <button onClick={handleStartMasking} disabled={isEditingBusy || showCompare} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md flex flex-col items-center justify-center text-xs disabled:opacity-50 transition-colors"> <BackspaceIcon className="w-5 h-5 mb-1" /> Remove Object </button>
              </div>

              {isCropping && (
                 <div className="flex gap-2 mt-2">
                    <button onClick={handleConfirmCrop} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><CheckIcon className="w-5 h-5 mr-2"/>Confirm</button>
                    <button onClick={() => setIsCropping(false)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><XMarkIcon className="w-5 h-5 mr-2"/>Cancel</button>
                </div>
              )}

              {isMasking && (
                 <div className="flex flex-col gap-2 mt-2">
                    <p className='text-sm text-center text-slate-600 dark:text-slate-300'>Brush over the object you want to remove.</p>
                    <div className="flex gap-2">
                        <button onClick={handleConfirmRemoval} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center disabled:bg-slate-500"><CheckIcon className="w-5 h-5 mr-2"/>Confirm Removal</button>
                        <button onClick={handleCancelRemoval} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><XMarkIcon className="w-5 h-5 mr-2"/>Cancel</button>
                    </div>
                </div>
              )}
                
              {pickedColor && (
                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center gap-4">
                    <div style={{ backgroundColor: pickedColor.hex }} className="w-10 h-10 rounded-md border-2 border-slate-300 dark:border-slate-500"></div>
                    <div className="text-sm">
                        <div className="flex items-center gap-2">
                            <p><strong>HEX:</strong> {pickedColor.hex}</p>
                            <button onClick={() => navigator.clipboard.writeText(pickedColor.hex)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><ClipboardIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <p><strong>RGB:</strong> {pickedColor.rgb}</p>
                            <button onClick={() => navigator.clipboard.writeText(pickedColor.rgb)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><ClipboardIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
              )}

              <fieldset disabled={showCompare} className="transition-opacity duration-300 disabled:opacity-40 disabled:pointer-events-none">
                {/* Filters */}
                <div className={`mt-6 ${isMasking ? 'hidden' : ''}`}>
                  <h3 className="text-lg font-semibold mb-2">Filters</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={handleUndoFilter} disabled={filterHistoryIndex === 0 || isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md disabled:opacity-50"><UndoIcon className="w-5 h-5" /></button>
                    <button onClick={handleRedoFilter} disabled={filterHistoryIndex === filterHistory.length - 1 || isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md disabled:opacity-50"><RedoIcon className="w-5 h-5" /></button>
                    <button onClick={() => applyFilter('none')} disabled={isEditingBusy} className={`px-3 py-1 rounded-md text-sm ${selectedFilter === 'none' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>None</button>
                    <button onClick={() => applyFilter('grayscale')} disabled={isEditingBusy} className={`px-3 py-1 rounded-md text-sm ${selectedFilter === 'grayscale' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Grayscale</button>
                    <button onClick={() => applyFilter('sepia')} disabled={isEditingBusy} className={`px-3 py-1 rounded-md text-sm ${selectedFilter === 'sepia' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Sepia</button>
                    <button onClick={() => applyFilter('vintage')} disabled={isEditingBusy} className={`px-3 py-1 rounded-md text-sm ${selectedFilter === 'vintage' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Vintage</button>
                  </div>
                </div>

                {/* Adjustments */}
                <div className={`mt-6 ${isMasking ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold mb-2">Adjustments</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="brightness" className="text-slate-600 dark:text-slate-300">Brightness: {brightness}%</label>
                            <input id="brightness" type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full accent-indigo-500"/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="contrast" className="text-slate-600 dark:text-slate-300">Contrast: {contrast}%</label>
                            <input id="contrast" type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full accent-indigo-500"/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="saturation" className="text-slate-600 dark:text-slate-300">Saturation: {saturation}%</label>
                            <input id="saturation" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full accent-indigo-500"/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="hue" className="text-slate-600 dark:text-slate-300">Hue: {hue}°</label>
                            <input id="hue" type="range" min="-180" max="180" value={hue} onChange={e => setHue(Number(e.target.value))} className="w-full accent-indigo-500"/>
                        </div>
                    </div>
                    <button onClick={resetAllImageSettings} disabled={isEditingBusy} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">Reset All Adjustments</button>
                </div>

                {/* Color Grading */}
                  <div className={`mt-6 ${isMasking ? 'hidden' : ''}`}>
                      <h3 className="text-lg font-semibold mb-2">Color Grading</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                          {/* Highlights */}
                          <div className="flex flex-col gap-2">
                              <label htmlFor="highlights-color" className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                  Highlights
                                  <input type="color" id="highlights-color" value={highlights.color} onChange={e => setHighlights(h => ({ ...h, color: e.target.value }))} className="w-6 h-6 p-0 border-none rounded bg-transparent cursor-pointer" />
                              </label>
                              <input id="highlights-intensity" type="range" min="0" max="100" value={highlights.intensity} onChange={e => setHighlights(h => ({ ...h, intensity: Number(e.target.value) }))} className="w-full accent-indigo-500" />
                          </div>
                          {/* Shadows */}
                          <div className="flex flex-col gap-2">
                              <label htmlFor="shadows-color" className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                  Shadows
                                  <input type="color" id="shadows-color" value={shadows.color} onChange={e => setShadows(s => ({ ...s, color: e.target.value }))} className="w-6 h-6 p-0 border-none rounded bg-transparent cursor-pointer" />
                              </label>
                              <input id="shadows-intensity" type="range" min="0" max="100" value={shadows.intensity} onChange={e => setShadows(s => ({ ...s, intensity: Number(e.target.value) }))} className="w-full accent-indigo-500" />
                          </div>
                      </div>
                  </div>

                {/* Presets */}
                <div className={`mt-6 ${isMasking ? 'hidden' : ''}`}>
                    <h3 className="text-lg font-semibold mb-2">Presets</h3>
                    {session?.user && (
                      <>
                      {isSavingPreset ? (
                          <div className="flex gap-2">
                              <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="Preset name..." className="flex-grow p-2 bg-slate-200 dark:bg-slate-600 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" autoFocus />
                              <button onClick={handleConfirmSavePreset} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"><CheckIcon className="w-5 h-5"/></button>
                              <button onClick={handleCancelSavePreset} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"><XMarkIcon className="w-5 h-5"/></button>
                          </div>
                      ) : (
                          <button onClick={handleStartSavePreset} disabled={isEditingBusy} className="w-full p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                              <BookmarkIcon className="w-4 h-4"/> Save Current Settings as Preset
                          </button>
                      )}
                      <div className="mt-2 space-y-2">
                          {presets.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No saved presets yet.</p>}
                          {presets.map(preset => (
                            <div key={preset.id} className="bg-slate-200 dark:bg-slate-700 rounded-lg p-2">
                                {editingPreset?.id === preset.id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={editingPresetName}
                                            onChange={(e) => setEditingPresetName(e.target.value)}
                                            className="flex-grow p-1 bg-white dark:bg-slate-600 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmEditPreset(); if (e.key === 'Escape') handleCancelEditPreset(); }}
                                            autoFocus
                                        />
                                        <button onClick={handleConfirmEditPreset} className="p-1.5 text-green-600 hover:bg-green-500/20 rounded-md" title="Save changes"><CheckIcon className="w-5 h-5"/></button>
                                        <button onClick={handleCancelEditPreset} className="p-1.5 text-red-600 hover:bg-red-500/20 rounded-md" title="Cancel edit"><XMarkIcon className="w-5 h-5"/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        <button 
                                            onClick={() => handleApplyPreset(preset)} 
                                            className="text-sm font-medium text-left flex-grow p-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600"
                                            title={`Apply "${preset.name}"`}
                                        >
                                            {preset.name}
                                        </button>
                                        <div className="flex items-center flex-shrink-0">
                                            <button onClick={() => handleStartEditPreset(preset)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-md" title={`Edit "${preset.name}"`}><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeletePreset(preset)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md" title={`Delete "${preset.name}"`}><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                          ))}
                      </div>
                    </>
                    )}
                    {!session?.user && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center bg-slate-100 dark:bg-slate-800 p-2 rounded-md">Sign in to save and use presets across devices.</p>
                    )}
                </div>

                {/* Portrait Enhancements */}
                  <div className={`mt-6 ${isMasking ? 'hidden' : ''}`}>
                      <h3 className="text-lg font-semibold mb-2">AI Portrait Enhancements</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <button onClick={() => setShowHairColorInput(!showHairColorInput)} disabled={isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"><PaintBrushIcon className="w-4 h-4"/> Hair Color</button>
                          <button onClick={() => setShowEyeColorInput(!showEyeColorInput)} disabled={isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"><EyeIcon className="w-4 h-4"/> Eye Color</button>
                          <button onClick={() => handlePortraitEnhancement('smile')} disabled={isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"><FaceSmileIcon className="w-4 h-4"/> Add Smile</button>
                      </div>
                      {showHairColorInput && (
                          <div className="flex gap-2 mt-2">
                              <input type="text" value={hairColor} onChange={e => setHairColor(e.target.value)} placeholder="e.g., vibrant pink" className="flex-grow p-2 bg-slate-200 dark:bg-slate-600 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                              <button onClick={() => handlePortraitEnhancement('hair')} disabled={isEditingBusy || !hairColor.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold disabled:bg-slate-500">Apply</button>
                          </div>
                      )}
                      {showEyeColorInput && (
                          <div className="flex gap-2 mt-2">
                              <input type="text" value={eyeColor} onChange={e => setEyeColor(e.target.value)} placeholder="e.g., bright green" className="flex-grow p-2 bg-slate-200 dark:bg-slate-600 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                              <button onClick={() => handlePortraitEnhancement('eyes')} disabled={isEditingBusy || !eyeColor.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold disabled:bg-slate-500">Apply</button>
                          </div>
                      )}
                  </div>
                  
                  {/* AI Clothing & Style */}
                  <div className={`mt-6 ${isMasking ? 'hidden' : ''}`}>
                      <h3 className="text-lg font-semibold mb-2">AI Clothing & Style</h3>
                      <div className="grid grid-cols-1">
                          <button onClick={() => setShowClothingInput(!showClothingInput)} disabled={isEditingBusy} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                              <TShirtIcon className="w-4 h-4"/> Change Outfit
                          </button>
                      </div>
                      {showClothingInput && (
                          <div className="flex gap-2 mt-2">
                              <input type="text" value={clothingPrompt} onChange={e => setClothingPrompt(e.target.value)} placeholder="e.g., a blue denim jacket" className="flex-grow p-2 bg-slate-200 dark:bg-slate-600 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                              <button onClick={handleClothingChange} disabled={isEditingBusy || !clothingPrompt.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold disabled:bg-slate-500">Apply</button>
                          </div>
                      )}
                  </div>
              </fieldset>

            </div>
          )}

          {isLoadingIdeas && (
            <div className="mt-4 p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Loader />
                    <span>Generating background ideas...</span>
                </div>
            </div>
          )}

          {backgroundIdeas.length > 0 && !isLoading && (
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Try a different background:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {backgroundIdeas.map((idea, index) => (
                        <button 
                            key={index}
                            onClick={() => handleRegenerateWithIdea(idea)}
                            className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-left text-sm text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            {idea}
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>
      {isLargeView && currentImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsLargeView(false)}
        >
          <img
            src={currentImage}
            alt="Large view"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsLargeView(false)}
            title="Close large view"
            className="absolute top-4 right-4 p-2 text-white bg-slate-800/70 hover:bg-slate-700 rounded-full transition-colors"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>
      )}
      <div className="mt-12 text-center">
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors hover:underline">
            &larr; Back to Dashboard
        </button>
      </div>
    </div>
  );
}
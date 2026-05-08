import React, { useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';
import { XMarkIcon, PhotoIcon, CheckIcon } from './IconComponents';

interface ShareToCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ImageUploadBox: React.FC<{ id: string; label: string; file: File | null; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, label, file, onFileChange }) => (
    <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <div className="aspect-square w-full bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center relative hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
            {file ? (
                <img src={URL.createObjectURL(file)} alt="preview" className="max-w-full max-h-full object-contain rounded-md" />
            ) : (
                <div className="text-center text-slate-400 dark:text-slate-500">
                    <PhotoIcon className="w-12 h-12 mx-auto" />
                    <p className="text-sm mt-1">Click to upload</p>
                </div>
            )}
            <input
                type="file"
                id={id}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/png, image/jpeg, image/webp"
                onChange={onFileChange}
            />
        </div>
    </div>
);


const ShareToCommunityModal: React.FC<ShareToCommunityModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { session } = useAuth();
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [editedImage, setEditedImage] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;
    
    const resetForm = useCallback(() => {
        setOriginalImage(null);
        setEditedImage(null);
        setPrompt('');
        setError('');
        setSuccess(false);
        setLoading(false);
    }, []);

    const handleClose = () => {
        resetForm();
        onClose();
    };
    
    const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user || !originalImage || !editedImage || !prompt.trim()) {
            setError("Please fill out all fields and upload both images.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const userId = session.user.id;
            const timestamp = Date.now();
            
            // 1. Upload original image
            const originalPath = `public/${userId}/${timestamp}-original.${originalImage.name.split('.').pop()}`;
            const { error: originalUploadError } = await supabase.storage.from('showcase-images').upload(originalPath, originalImage);
            if (originalUploadError) throw originalUploadError;
            const { data: { publicUrl: original_image_url } } = supabase.storage.from('showcase-images').getPublicUrl(originalPath);

            // 2. Upload edited image
            const editedPath = `public/${userId}/${timestamp}-edited.${editedImage.name.split('.').pop()}`;
            const { error: editedUploadError } = await supabase.storage.from('showcase-images').upload(editedPath, editedImage);
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
            
            setSuccess(true);
            setTimeout(() => {
                onSuccess(); // Close modal and refresh parent
                resetForm();
            }, 2000);

        } catch (err: any) {
            setError(`Failed to share: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
        >
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 id="share-modal-title" className="text-xl font-bold">Share Your Creation</h3>
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                {success ? (
                    <div className="p-8 text-center">
                        <CheckIcon className="w-16 h-16 mx-auto text-green-500 bg-green-100 dark:bg-green-900/50 rounded-full p-3" />
                        <h4 className="text-xl font-bold mt-4">Shared Successfully!</h4>
                        <p className="text-slate-500 dark:text-slate-400">Your creation is now live in the community showcase.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ImageUploadBox id="original-image-upload" label="Original Image (Before)" file={originalImage} onFileChange={handleFileChange(setOriginalImage)} />
                                <ImageUploadBox id="edited-image-upload" label="Edited Image (After)" file={editedImage} onFileChange={handleFileChange(setEditedImage)} />
                            </div>
                             <div>
                                <label htmlFor="prompt" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Prompt Used</label>
                                <textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="e.g., 'A photo of a cat wearing a tiny wizard hat, cinematic lighting...'"
                                    className="w-full p-2 bg-white dark:bg-slate-900 rounded-md placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-300 dark:border-slate-600"
                                />
                            </div>
                            {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-lg">
                            <button type="button" onClick={handleClose} className="py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold rounded-md transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-500 flex items-center justify-center min-w-[100px]">
                                {loading ? <Loader /> : 'Share'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ShareToCommunityModal;
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import Loader from './Loader';
import ShowcaseCard from './ShowcaseCard';
import { useAuth } from '../contexts/AuthContext';
import { UserGroupIcon, ArrowUpTrayIcon } from './IconComponents';
import ShareToCommunityModal from './ShareToCommunityModal';

interface ShowcasePost {
    id: string;
    created_at: string;
    user_id: string;
    prompt: string;
    original_image_url: string;
    edited_image_url: string;
    likes: number;
    profiles: {
        username: string | null;
        avatar_url: string | null;
    } | null;
    showcase_likes: { user_id: string }[];
}

interface CommunityPageProps {
    onNavigate: (view: 'dashboard' | 'editor') => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ onNavigate }) => {
    const { session } = useAuth();
    const [posts, setPosts] = useState<ShowcasePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('community_showcase')
                .select(`
                    id,
                    created_at,
                    user_id,
                    prompt,
                    original_image_url,
                    edited_image_url,
                    likes,
                    profiles ( username, avatar_url ),
                    showcase_likes ( user_id )
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            
            setPosts(data as ShowcasePost[]);
        } catch (err: any) {
            setError(`Failed to load community posts: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left mb-12">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        Community Showcase
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                        Get inspired by creations from the FeasiPix community.
                    </p>
                </div>
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="mt-6 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 transform hover:scale-105 flex items-center gap-2"
                >
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Share Your Creation
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader large />
                </div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : posts.length === 0 ? (
                 <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <UserGroupIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold">The Showcase is Quiet... For Now</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Be the first to share your creation from the editor!
                    </p>
                    <button
                        onClick={() => onNavigate('editor')}
                        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 transform hover:scale-105"
                    >
                        Go to Editor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <ShowcaseCard key={post.id} post={post} />
                    ))}
                </div>
            )}
            
            <div className="mt-12 text-center">
                <button onClick={() => onNavigate('dashboard')} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors hover:underline">
                    &larr; Back to Dashboard
                </button>
            </div>
            
            <ShareToCommunityModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                onSuccess={() => {
                    setIsShareModalOpen(false);
                    fetchPosts();
                }} 
            />
        </div>
    );
};

export default CommunityPage;
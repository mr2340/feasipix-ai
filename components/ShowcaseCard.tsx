import React, { useState, useEffect } from 'react';
import ReactCompareImage from 'react-compare-image';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from './supabaseClient';
import { UserCircleIcon, HeartIcon, HeartIconSolid } from './IconComponents';

// Define the shape of a post object, including nested profile and likes
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

interface ShowcaseCardProps {
    post: ShowcasePost;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ post }) => {
    const { session } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        // Check if the current user's ID is in the list of likes for this post
        if (session?.user && post.showcase_likes) {
            setIsLiked(post.showcase_likes.some(like => like.user_id === session.user.id));
        }
    }, [post.showcase_likes, session?.user]);

    const handleLike = async () => {
        if (!session?.user || isLiking) return;

        setIsLiking(true);
        const currentUserId = session.user.id;
        const showcaseId = post.id;
        
        // Optimistic UI update
        const originallyLiked = isLiked;
        setIsLiked(!originallyLiked);
        setLikeCount(prev => originallyLiked ? prev - 1 : prev + 1);

        try {
            if (originallyLiked) {
                // Unlike the post
                const { error } = await supabase
                    .from('showcase_likes')
                    .delete()
                    .match({ user_id: currentUserId, showcase_id: showcaseId });
                
                if (error) throw error;

                // Decrement likes count in the main table using an RPC function for atomicity
                await supabase.rpc('decrement_likes', { post_id: showcaseId });
            } else {
                // Like the post
                const { error } = await supabase
                    .from('showcase_likes')
                    .insert({ user_id: currentUserId, showcase_id: showcaseId });
                
                if (error) throw error;
                
                // Increment likes count
                await supabase.rpc('increment_likes', { post_id: showcaseId });
            }
        } catch (error) {
            console.error('Error liking/unliking post:', error);
            // Revert optimistic update on failure
            setIsLiked(originallyLiked);
            setLikeCount(post.likes);
        } finally {
            setIsLiking(false);
        }
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="aspect-square">
                <ReactCompareImage 
                    leftImage={post.original_image_url}
                    rightImage={post.edited_image_url}
                    leftImageLabel="Before"
                    rightImageLabel="After"
                />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 flex-grow bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                   <span className="font-semibold">Prompt:</span> "{post.prompt}"
                </p>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt={post.profiles.username || 'user'} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-8 h-8 text-slate-400" />
                        )}
                        <div>
                            <p className="text-sm font-semibold">{post.profiles?.username || 'Anonymous'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(post.created_at)}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLike}
                        disabled={isLiking || !session?.user}
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 disabled:opacity-50 transition-colors duration-200"
                    >
                        {isLiked ? (
                            <HeartIconSolid className="w-6 h-6 text-red-500" />
                        ) : (
                            <HeartIcon className="w-6 h-6 hover:text-red-500" />
                        )}
                        <span className="font-semibold text-sm">{likeCount}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShowcaseCard;
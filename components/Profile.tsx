import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from './supabaseClient';
import Loader from './Loader';
import { UserCircleIcon, TrashIcon, ArrowLeftOnRectangleIcon } from './IconComponents';

interface ProfileProps {
    onBack: () => void;
    onContactClick: () => void;
    onNavigate: (view: any) => void;
}

interface DBPreset {
    id: string;
    name: string;
}

const Profile: React.FC<ProfileProps> = ({ onBack, onContactClick, onNavigate }) => {
  const { session, profile, updateProfile, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [presets, setPresets] = useState<DBPreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchPresets = async () => {
      if (!session?.user) {
        setPresetsLoading(false);
        return;
      };
      try {
        setPresetsLoading(true);
        const { data, error } = await supabase
          .from('presets')
          .select('id, name')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setPresets(data);
      } catch (error: any) {
        alert(error.message);
      } finally {
        setPresetsLoading(false);
      }
    };
    fetchPresets();
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ username, avatar_url: avatarUrl });
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session!.user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;
      setAvatarUrl(newAvatarUrl);

      // Also update the profile in the database
      await updateProfile({ username, avatar_url: newAvatarUrl });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    if (window.confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
      try {
        const { error } = await supabase.from('presets').delete().eq('id', presetId);
        if (error) throw error;
        setPresets(presets.filter(p => p.id !== presetId));
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  if (authLoading || !profile) {
      return (
          <div className="flex-grow flex items-center justify-center h-screen">
              <Loader large />
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white">
        <h1 className="text-3xl font-bold mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">Account Settings</h1>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-lg shadow-lg">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center space-x-6">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-24 w-24 text-slate-400 dark:text-slate-500" />
                    )}
                    <div>
                        <label htmlFor="avatar-upload" className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors">
                            {uploading ? 'Uploading...' : 'Upload New Avatar'}
                        </label>
                        <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                        />
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">PNG, JPG, GIF up to 2MB</p>
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                    <input id="email" type="text" value={session?.user.email} disabled className="w-full p-2 bg-slate-200 dark:bg-slate-700 rounded-md placeholder-slate-400 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-600" />
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 rounded-md placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-300 dark:border-slate-600"
                    />
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-slate-500 flex items-center justify-center min-w-[120px]">
                        {loading ? <Loader /> : 'Update Profile'}
                    </button>
                    <button type="button" onClick={onBack} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold py-2 px-6 rounded-md transition-colors">
                        Back to Dashboard
                    </button>
                </div>
            </form>
        </div>

        {/* Presets Section */}
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Your Saved Presets</h2>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg shadow-lg min-h-[100px]">
            {presetsLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader />
                </div>
            ) : presets.length > 0 ? (
                <ul className="space-y-3">
                {presets.map(preset => (
                    <li key={preset.id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded-md animate-fade-in-down" style={{animationDuration: '300ms'}}>
                    <span className="font-medium">{preset.name}</span>
                    <button
                        onClick={() => handleDeletePreset(preset.id, preset.name)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors"
                        title={`Delete ${preset.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center pt-4">You haven't saved any presets yet. Go to the editor to create some!</p>
            )}
            </div>
        </div>
      
        {/* Sign Out Section */}
        <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8 flex justify-center items-center gap-4">
            <button
                onClick={onContactClick}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
                Contact Support
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div> {/* separator */}
            <button
                onClick={() => onNavigate('developer')}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
                Developer
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div> {/* separator */}
            <button
                onClick={signOut}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-red-500/10 hover:dark:bg-red-600/80 hover:text-red-600 dark:hover:text-white font-bold py-2 px-6 rounded-md transition-colors flex items-center gap-2"
            >
                <ArrowLeftOnRectangleIcon className="w-5 h-5"/>
                Sign Out
            </button>
        </div>
        <style>{`
        @keyframes fade-in-down {
            0% {
                opacity: 0;
                transform: translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-down {
            animation: fade-in-down ease-out;
        }
      `}</style>
    </div>
  );
};

export default Profile;
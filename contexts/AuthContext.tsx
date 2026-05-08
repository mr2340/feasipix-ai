import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../components/supabaseClient';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// Define the shape of a user profile
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

// Define the context value shape
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: { username: string; avatar_url: string; }) => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
// FIX: Explicitly typed component with React.FC to resolve issue where children prop was not being inferred correctly in JSX.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the initial session
    const fetchSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Error fetching session:", error.message);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Effect to fetch user profile when user ID changes
  useEffect(() => {
    if (user?.id) {
      const fetchAndSyncProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, updated_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error.message);
        } else if (data) {
          setProfile(data);
        }
      };
      fetchAndSyncProfile();
    } else {
        // Clear profile when user logs out
        setProfile(null);
    }
  }, [user?.id]); // Depend on the stable user ID

  // Function to update user profile
  const updateProfile = async (updates: { username: string; avatar_url: string; }) => {
    if (!user) throw new Error("No user is logged in");
    
    setLoading(true);
    const profileUpdates = {
      ...updates,
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(profileUpdates);
    if (error) {
      setLoading(false);
      throw error;
    }
    
    // Refresh the profile data
    setProfile(prevProfile => prevProfile ? { ...prevProfile, ...profileUpdates } : profileUpdates as Profile);
    setLoading(false);
  };


  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
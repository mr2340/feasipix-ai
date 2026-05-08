import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AccountDropdown from './AccountDropdown';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onNavigate: (view: 'landing' | 'editor' | 'auth' | 'profile' | 'dashboard') => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { session, profile, signOut } = useAuth();

  const handleLogoClick = () => {
    if (session) {
      onNavigate('dashboard');
    } else {
      onNavigate('landing');
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={handleLogoClick} 
            className="flex items-center gap-2 font-extrabold text-2xl tracking-wide 
                       bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 
                       dark:from-blue-400 dark:via-purple-500 dark:to-pink-500 
                       bg-clip-text text-transparent"
          >
            FeasiPix
          </button>
          
          <div className="flex items-center gap-4">
             <ThemeToggle />
            {session && profile ? (
              <>
                <AccountDropdown 
                  profile={profile}
                  email={session.user.email}
                  onSignOut={signOut}
                  onProfileClick={() => onNavigate('profile')}
                />
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('auth')}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-semibold"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => onNavigate('auth')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
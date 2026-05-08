import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../contexts/AuthContext';
import { UserCircleIcon, ArrowLeftOnRectangleIcon, ChevronDownIcon } from './IconComponents';

interface AccountDropdownProps {
  profile: Profile;
  email?: string;
  onSignOut: () => void;
  onProfileClick: () => void;
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({ profile, email, onSignOut, onProfileClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleProfileClick = () => {
    onProfileClick();
    setIsOpen(false);
  };

  const handleSignOutClick = () => {
    onSignOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-indigo-500"
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="User Avatar" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <UserCircleIcon className="w-9 h-9 text-slate-500 dark:text-slate-400" />
        )}
        <span className="hidden sm:inline text-sm font-semibold">{profile.username || 'Account'}</span>
        <ChevronDownIcon className={`hidden sm:inline w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 animate-fade-in-down"
          style={{ animationDuration: '150ms' }}
        >
          <div className="py-1">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={profile.username || undefined}>
                {profile.username || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={email}>
                {email}
              </p>
            </div>
            <div className="p-1">
                <button
                    onClick={handleProfileClick}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <UserCircleIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    Your Profile
                </button>
                <button
                    onClick={handleSignOutClick}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    Sign Out
                </button>
            </div>
          </div>
        </div>
      )}
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

export default AccountDropdown;
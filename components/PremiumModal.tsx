import React, { Fragment } from 'react';
import { RocketLaunchIcon, XMarkIcon, CheckIcon } from './IconComponents';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  const features = [
    'Unlimited AI Edits',
    'Access to All Tools',
    'Priority Support',
    'No More Coin Limits'
  ];

  return (
    <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="premium-modal-title"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-8">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                aria-label="Close modal"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
          
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4">
                    <RocketLaunchIcon className="h-8 w-8 text-white" />
                </div>
                <h3 id="premium-modal-title" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 text-transparent bg-clip-text">
                    Go Premium
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Unlock your full creative potential.</p>
            </div>

            <div className="mt-6">
                <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-500/10 dark:bg-green-500/20 rounded-full">
                                <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-8">
                <button
                    onClick={onUpgrade}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
                >
                    Upgrade for $2/month
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3">You can cancel anytime.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
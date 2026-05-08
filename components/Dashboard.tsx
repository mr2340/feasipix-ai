import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MagicWandIcon, UserCircleIcon, ArrowRightIcon, SparklesIcon, ImageToTextIcon, FaceSmileIcon, ChatBubbleOvalLeftEllipsisIcon, UserGroupIcon, LightBulbIcon } from './IconComponents';

interface DashboardProps {
  onNavigate: (view: 'editor' | 'profile' | 'imageToText' | 'faceRetouch' | 'developer' | 'whyFeasiPix' | 'community') => void;
  onQuickEnhance: (file: File) => void;
  onContactClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onQuickEnhance, onContactClick }) => {
  const { profile } = useAuth();
  const quickEnhanceInputRef = useRef<HTMLInputElement>(null);

  const handleEnhanceClick = () => {
    quickEnhanceInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onQuickEnhance(file);
    }
  };

  const dashboardCards = [
    {
      title: "Start a New Project",
      description: "Upload an image and begin creating with our AI editor.",
      icon: MagicWandIcon,
      iconBgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
      iconTextColor: "text-indigo-500 dark:text-indigo-400",
      actionText: "Go to Editor",
      onClick: () => onNavigate('editor'),
      hoverShadow: "hover:shadow-indigo-500/20"
    },
    {
      title: "Community Showcase",
      description: "Browse creations from the community for inspiration.",
      icon: UserGroupIcon,
      iconBgColor: "bg-sky-500/10 dark:bg-sky-500/20",
      iconTextColor: "text-sky-500 dark:text-sky-400",
      actionText: "Explore Creations",
      onClick: () => onNavigate('community'),
      hoverShadow: "hover:shadow-sky-500/20"
    },
    {
      title: "Quick Enhance",
      description: "Let our AI give your photo a professional polish in one click.",
      icon: SparklesIcon,
      iconBgColor: "bg-teal-500/10 dark:bg-teal-500/20",
      iconTextColor: "text-teal-500 dark:text-teal-400",
      actionText: "Upload & Enhance",
      onClick: handleEnhanceClick,
      hoverShadow: "hover:shadow-teal-500/20"
    },
    {
      title: "✨ Face Retouch",
      description: "Enhance portraits: smooth skin, whiten teeth, and more.",
      icon: FaceSmileIcon,
      iconBgColor: "bg-pink-500/10 dark:bg-pink-500/20",
      iconTextColor: "text-pink-500 dark:text-pink-400",
      actionText: "Upload & Retouch",
      onClick: () => onNavigate('faceRetouch'),
      hoverShadow: "hover:shadow-pink-500/20"
    },
    {
      title: "Image to Text",
      description: "Extract a detailed prompt from an image, capturing its style.",
      icon: ImageToTextIcon,
      iconBgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
      iconTextColor: "text-cyan-500 dark:text-cyan-400",
      actionText: "Generate Prompt",
      onClick: () => onNavigate('imageToText'),
      hoverShadow: "hover:shadow-cyan-500/20"
    },
    {
      title: "Why FeasiPix?",
      description: "Discover the vision, story, and tech behind our project.",
      icon: LightBulbIcon,
      iconBgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      iconTextColor: "text-amber-500 dark:text-amber-400",
      actionText: "Read Our Story",
      onClick: () => onNavigate('whyFeasiPix'),
      hoverShadow: "hover:shadow-amber-500/20"
    },
    {
      title: "Manage Your Profile",
      description: "Update your username, avatar, and settings.",
      icon: UserCircleIcon,
      iconBgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      iconTextColor: "text-purple-500 dark:text-purple-400",
      actionText: "Go to Profile",
      onClick: () => onNavigate('profile'),
      hoverShadow: "hover:shadow-purple-500/20"
    },
    {
        title: "Contact Us",
        description: "Have questions? Reach out to our support team.",
        icon: ChatBubbleOvalLeftEllipsisIcon,
        iconBgColor: "bg-orange-500/10 dark:bg-orange-500/20",
        iconTextColor: "text-orange-500 dark:text-orange-400",
        actionText: "Get in Touch",
        onClick: onContactClick,
        hoverShadow: "hover:shadow-orange-500/20"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Welcome back, <span className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 text-transparent bg-clip-text">{profile?.username || 'Creator'}!</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">What would you like to do today?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {dashboardCards.map((card, index) => (
          <div 
            key={index}
            onClick={card.onClick}
            className={`group bg-slate-50 dark:bg-slate-800/50 p-8 rounded-lg shadow-md dark:shadow-lg cursor-pointer transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 ${card.hoverShadow} hover:-translate-y-1`}
          >
            <div className="flex items-center gap-6">
              <div className={`flex-shrink-0 flex items-center justify-center ${card.iconBgColor} w-16 h-16 rounded-full`}>
                <card.icon className={`w-8 h-8 ${card.iconTextColor}`} />
              </div>
              <div>
                  <h2 className="text-2xl font-bold mb-1">{card.title}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">{card.description}</p>
                  <span className={`font-semibold ${card.iconTextColor} flex items-center gap-2`}>
                      {card.actionText} <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
              </div>
            </div>
          </div>
        ))}
      </div>
       <input
        type="file"
        ref={quickEnhanceInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
    </div>
  );
};

export default Dashboard;
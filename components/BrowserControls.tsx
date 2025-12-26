
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface IconButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="p-2 rounded-full hover:bg-gemini-gray-700 disabled:text-gemini-gray-600 disabled:hover:bg-transparent transition-colors"
  >
    {children}
  </button>
);

interface BrowserControlsProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  canGoBack: boolean;
  onForward: () => void;
  canGoForward: boolean;
  onReload: () => void;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  isBookmarked: boolean;
  onAddBookmark: () => void;
  onRemoveBookmark: () => void;
}

export const BrowserControls: React.FC<BrowserControlsProps> = ({
  currentUrl,
  onNavigate,
  onBack,
  canGoBack,
  onForward,
  canGoForward,
  onReload,
  isPanelOpen,
  onTogglePanel,
  isBookmarked,
  onAddBookmark,
  onRemoveBookmark
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);

  useEffect(() => {
    setInputValue(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onNavigate(inputValue);
  };

  return (
    <header className="flex items-center p-2 bg-gray-200 border-b border-gray-300 shadow-md z-10">
      <div className="flex items-center space-x-1">
        <IconButton onClick={onBack} disabled={!canGoBack}>{ICONS.back}</IconButton>
        <IconButton onClick={onForward} disabled={!canGoForward}>{ICONS.forward}</IconButton>
        <IconButton onClick={onReload}>{ICONS.reload}</IconButton>
      </div>
      <div className="flex-1 mx-4 relative flex items-center">
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Search or type a URL"
          />
        </form>
        <button 
            onClick={isBookmarked ? onRemoveBookmark : onAddBookmark} 
            className="absolute right-2 p-2 rounded-full hover:bg-gray-300 transition-colors"
            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {isBookmarked ? <span className="text-blue-500">{ICONS.bookmark_filled}</span> : ICONS.bookmark_outline}
        </button>
      </div>
      <button
        onClick={onTogglePanel}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${isPanelOpen ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-gray-300'}`}
      >
        {ICONS.gemini}
        <span className="text-sm font-medium">Gemini</span>
      </button>
    </header>
  );
};

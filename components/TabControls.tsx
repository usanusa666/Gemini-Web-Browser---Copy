
import React from 'react';
import { Tab } from '../types';
import { ICONS } from '../constants';

interface TabControlsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabControls: React.FC<TabControlsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="flex items-center bg-gray-200 pt-2 px-2">
      <div className="flex items-end overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex items-center justify-between min-w-[120px] max-w-[200px] h-10 px-3 mr-1 cursor-pointer transition-colors duration-200
              ${activeTabId === tab.id
                ? 'bg-white text-gray-800'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            style={{
              clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)',
            }}
          >
            <div className="flex items-center overflow-hidden">
              {tab.favicon && <img src={tab.favicon} alt="favicon" className="w-4 h-4 mr-2 flex-shrink-0"/>}
              <span className="text-xs truncate">{tab.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="ml-2 p-1 rounded-full hover:bg-gray-400 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button 
        onClick={onNewTab}
        className="p-2 ml-1 rounded-full hover:bg-gray-300"
        title="New Tab"
      >
        {ICONS.add}
      </button>
    </div>
  );
};

// Add a simple scrollbar-hide utility if not using a plugin
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.append(style);

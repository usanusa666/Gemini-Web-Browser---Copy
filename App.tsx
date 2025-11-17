
import React, { useState, useCallback, useEffect } from 'react';
import { BrowserControls } from './components/BrowserControls';
import { WebView } from './components/WebView';
import { GeminiPanel } from './components/GeminiPanel';
import { TabControls } from './components/TabControls';
import { Tab, Bookmark, DownloadItem } from './types';

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "New Tab";
  }
};

const getFaviconUrl = (url: string): string => {
  const hostname = getHostname(url);
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
};

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  // --- Initialization ---
  useEffect(() => {
    // Load bookmarks from local storage
    const storedBookmarks = localStorage.getItem('gemini-browser-bookmarks');
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks));
    }
    // Create initial tab
    handleNewTab();
  }, []);

  // --- Bookmark Persistence ---
  useEffect(() => {
    localStorage.setItem('gemini-browser-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // --- Download Simulation ---
  useEffect(() => {
    // Simulate receiving new downloads
    const newDownloadInterval = setInterval(() => {
        const id = crypto.randomUUID();
        const newItem: DownloadItem = {
            id,
            filename: `document_${id.substring(0, 4)}.pdf`,
            url: "https://example.com/file.pdf",
            state: 'progressing',
            progress: 0,
            receivedBytes: 0,
            totalBytes: Math.floor(Math.random() * (200 * 1024 * 1024 - 5 * 1024 * 1024 + 1)) + 5 * 1024 * 1024, // 5MB - 200MB
            startTime: Date.now()
        };
        setDownloads(prev => [newItem, ...prev]);
    }, 25000);

    // Simulate download progress
    const progressInterval = setInterval(() => {
        setDownloads(prev => prev.map(item => {
            if (item.state === 'progressing' && item.progress < 100) {
                const newReceived = item.receivedBytes + item.totalBytes / (Math.random() * 20 + 10); // variable speed
                const progress = Math.min(100, Math.floor((newReceived / item.totalBytes) * 100));
                return { ...item, progress, receivedBytes: newReceived, state: progress === 100 ? 'completed' : 'progressing' };
            }
            return item;
        }));
    }, 500);

    return () => {
        clearInterval(newDownloadInterval);
        clearInterval(progressInterval);
    };
}, []);


  const activeTab = tabs.find(t => t.id === activeTabId);

  // --- Tab Management ---
  const handleNewTab = (url: string = 'https://www.google.com/webhp?igu=1') => {
    const newTab: Tab = {
      id: crypto.randomUUID(),
      history: [url],
      currentIndex: 0,
      title: getHostname(url),
      favicon: getFaviconUrl(url),
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };
  
  const handleSelectTab = (tabId: string) => setActiveTabId(tabId);

  const handleCloseTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    
    const newTabs = tabs.filter(t => t.id !== tabId);

    if (activeTabId === tabId) {
      let newActiveId: string | null = null;
      if (newTabs.length > 0) {
        newActiveId = newTabs[Math.max(0, tabIndex - 1)]?.id;
      }
      setActiveTabId(newActiveId);
    }
    setTabs(newTabs);
  };
  
  const updateTab = (tabId: string, updates: Partial<Tab>) => {
     setTabs(prevTabs => prevTabs.map(tab => tab.id === tabId ? { ...tab, ...updates } : tab));
  };
  
  // --- Navigation ---
  const navigate = useCallback((url: string) => {
    if (!activeTab) return;
    
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    const newHistory = activeTab.history.slice(0, activeTab.currentIndex + 1);
    newHistory.push(finalUrl);

    updateTab(activeTab.id, {
        history: newHistory,
        currentIndex: newHistory.length - 1,
        title: getHostname(finalUrl),
        favicon: getFaviconUrl(finalUrl),
    });
  }, [activeTab]);

  const goBack = () => {
    if (activeTab && activeTab.currentIndex > 0) {
      updateTab(activeTab.id, { currentIndex: activeTab.currentIndex - 1 });
    }
  };

  const goForward = () => {
    if (activeTab && activeTab.currentIndex < activeTab.history.length - 1) {
      updateTab(activeTab.id, { currentIndex: activeTab.currentIndex + 1 });
    }
  };
  
  const reload = () => {
    if (!activeTab) return;
    const urlToReload = activeTab.history[activeTab.currentIndex];
    // This trick forces the iframe to reload by changing its key
    updateTab(activeTab.id, { history: [...activeTab.history] }); 
  };
  
  // --- Bookmarks ---
  const isBookmarked = (url: string) => bookmarks.some(b => b.url === url);

  const addBookmark = (url: string, title: string) => {
    if (isBookmarked(url)) return;
    const newBookmark: Bookmark = { id: crypto.randomUUID(), url, title };
    setBookmarks(prev => [...prev, newBookmark]);
  };
  
  const removeBookmark = (id: string) => {
     setBookmarks(prev => prev.filter(b => b.id !== id));
  };
  
  return (
    <div className="flex flex-col h-screen bg-gemini-gray-900 text-gray-100 font-sans">
      <TabControls
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />
      <BrowserControls
        currentUrl={activeTab?.history[activeTab.currentIndex] || ''}
        onNavigate={navigate}
        onBack={goBack}
        canGoBack={activeTab ? activeTab.currentIndex > 0 : false}
        onForward={goForward}
        canGoForward={activeTab ? activeTab.currentIndex < activeTab.history.length - 1 : false}
        onReload={reload}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        isBookmarked={isBookmarked(activeTab?.history[activeTab.currentIndex] || '')}
        onAddBookmark={() => activeTab && addBookmark(activeTab.history[activeTab.currentIndex], activeTab.title)}
        onRemoveBookmark={() => {
            const bookmark = bookmarks.find(b => b.url === activeTab?.history[activeTab.currentIndex]);
            if (bookmark) removeBookmark(bookmark.id);
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className={`flex-1 transition-all duration-300 ease-in-out relative ${isPanelOpen ? 'w-2/3' : 'w-full'}`}>
            {tabs.map((tab) => (
                 <div key={tab.id} className="w-full h-full" style={{ display: tab.id === activeTabId ? 'block' : 'none' }}>
                    <WebView url={tab.history[tab.currentIndex]} />
                </div>
            ))}
        </main>
        <aside 
          className={`transition-all duration-300 ease-in-out bg-gemini-gray-800 overflow-hidden ${isPanelOpen ? 'w-1/3 max-w-2xl' : 'w-0'}`}
          style={{ minWidth: isPanelOpen ? '400px' : '0' }}
        >
          {isPanelOpen && (
            <GeminiPanel
                currentUrl={activeTab?.history[activeTab.currentIndex] || ''}
                bookmarks={bookmarks}
                onRemoveBookmark={removeBookmark}
                onNavigate={(url) => {
                    navigate(url);
                    setIsPanelOpen(false);
                }}
                downloads={downloads}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;

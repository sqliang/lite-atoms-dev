import React, { createContext, useContext, useState, useCallback } from 'react';

export type TabType = 'code' | 'image' | 'document';

export interface WorkspaceTab {
  id: string;
  title: string;
  type: TabType;
  content: string;
  language?: string;
  isActive: boolean;
}

interface WorkspaceContextType {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  openTab: (tab: Omit<WorkspaceTab, 'isActive'>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback((tab: Omit<WorkspaceTab, 'isActive'>) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === tab.id);
      if (existing) {
        return prev.map((t) => ({ ...t, isActive: t.id === tab.id }));
      }
      return [
        ...prev.map((t) => ({ ...t, isActive: false })),
        { ...tab, isActive: true },
      ];
    });
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length > 0) {
        const lastTab = filtered[filtered.length - 1];
        lastTab.isActive = true;
        setActiveTabId(lastTab.id);
      } else {
        setActiveTabId(null);
      }
      return filtered;
    });
  }, []);

  const setActiveTab = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
    setActiveTabId(id);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTab }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
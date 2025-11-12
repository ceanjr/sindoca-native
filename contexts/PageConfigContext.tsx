import React, { createContext, useContext, useState } from 'react';

interface PageConfig {
  title: string;
  showBackButton?: boolean;
  headerRight?: React.ReactNode;
}

interface PageConfigContextType {
  config: PageConfig;
  setConfig: (config: PageConfig) => void;
  updateTitle: (title: string) => void;
}

const PageConfigContext = createContext<PageConfigContextType | undefined>(undefined);

export function PageConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PageConfig>({
    title: 'Sindoca',
    showBackButton: false,
  });

  const updateTitle = (title: string) => {
    setConfig((prev) => ({ ...prev, title }));
  };

  return (
    <PageConfigContext.Provider
      value={{
        config,
        setConfig,
        updateTitle,
      }}
    >
      {children}
    </PageConfigContext.Provider>
  );
}

export function usePageConfig() {
  const context = useContext(PageConfigContext);
  if (context === undefined) {
    throw new Error('usePageConfig must be used within a PageConfigProvider');
  }
  return context;
}

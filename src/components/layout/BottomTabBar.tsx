import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Calculator, FolderOpen } from 'lucide-react';

export type TabType = 'configuration' | 'calculation' | 'scenarios';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const tabs: { key: TabType; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { key: 'configuration', label: t('nav.configuration'), icon: ClipboardList },
    { key: 'calculation', label: t('nav.calculation'), icon: Calculator },
    { key: 'scenarios', label: t('nav.scenarios'), icon: FolderOpen },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 transition-colors duration-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`
                flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                transition-colors duration-200 cursor-pointer
                active:scale-95 transform
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'}
              `}
            >
              <Icon size={22} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;

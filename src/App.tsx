import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Activity, Box, Settings } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SafeArea } from 'capacitor-plugin-safe-area';
import Sidebar from '@/components/layout/Sidebar';
import BottomTabBar, { TabType } from '@/components/layout/BottomTabBar';
import ConfigurationView from '@/components/views/ConfigurationView';
import CalculationView from '@/components/views/CalculationView';
import ScenariosView from '@/components/views/ScenariosView';
import SettingsPanel from '@/components/views/SettingsPanel';
import AdaptivePanel from '@/components/common/AdaptivePanel';
import { Scenario, ViewMode, OptimizationResult } from '@/types';
import { useIsDesktop } from '@/hooks/useMediaQuery';

// Default initial data
const INITIAL_SCENARIOS: Scenario[] = [
  {
    id: '1',
    name: '默认方案',
    indicators: [
      { id: 'i1', name: '水分', unit: '%', min: 10, max: 14 },
      { id: 'i2', name: '蛋白质', unit: '%', min: 18, max: 25 },
    ],
    materials: [
      { id: 'm1', name: '原料A', price: 2000, indicatorValues: { 'i1': 12, 'i2': 20 } },
      { id: 'm2', name: '原料B', price: 1800, indicatorValues: { 'i1': 14, 'i2': 15 } },
      { id: 'm3', name: '原料C', price: 2500, indicatorValues: { 'i1': 10, 'i2': 30 } },
    ]
  }
];

function App() {
  const { t } = useTranslation();
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem('optimix_scenarios');
    return saved ? JSON.parse(saved) : INITIAL_SCENARIOS;
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  const [currentView, setCurrentView] = useState<ViewMode>('configuration');
  const [activeTab, setActiveTab] = useState<TabType>('configuration');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isDesktop = useIsDesktop();

  // 设置面板状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 视图切换动画状态
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);

  // 方案切换动画状态
  const [isScenarioTransitioning, setIsScenarioTransitioning] = useState(false);

  // 状态栏高度状态
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  // Theme State: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        return savedTheme as 'light' | 'dark' | 'system';
      }
    }
    return 'system';
  });

  // 实际应用的主题
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // 获取安全区域并配置状态栏
  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const safeAreaData = await SafeArea.getSafeAreaInsets();
          const topInset = safeAreaData.insets.top;
          setStatusBarHeight(topInset);

          document.documentElement.style.setProperty('--safe-area-top', `${topInset}px`);
          document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaData.insets.bottom}px`);
        } catch (error) {
          console.log('SafeArea plugin error:', error);
          setStatusBarHeight(28);
          document.documentElement.style.setProperty('--safe-area-top', '28px');
        }

        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
        } catch (error) {
          console.log('StatusBar plugin error:', error);
        }
      }
    };

    initializeApp();
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // 根据 theme 设置计算 resolvedTheme
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 更新状态栏样式
  useEffect(() => {
    const updateStatusBarStyle = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          if (resolvedTheme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
          } else {
            await StatusBar.setStyle({ style: Style.Light });
          }
        } catch (error) {
          console.log('StatusBar style error:', error);
        }
      }
    };
    updateStatusBarStyle();
  }, [resolvedTheme]);

  // Apply Theme
  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('optimix_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  // 视图切换动画处理（PC 端顶部 Tab）
  const handleViewChange = (newView: ViewMode) => {
    if (newView === currentView || isViewTransitioning) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setCurrentView(newView);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsViewTransitioning(false);
        }, 50);
      });
    }, 200);
  };

  // Tab 切换处理（移动端底部 Tab Bar）
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      if (tab === 'configuration' || tab === 'calculation') {
        setCurrentView(tab);
      }
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsViewTransitioning(false);
        }, 50);
      });
    }, 200);
  };

  // 方案切换动画处理
  const handleScenarioChange = (newScenarioId: string) => {
    if (newScenarioId === activeScenarioId || isScenarioTransitioning) return;
    setIsScenarioTransitioning(true);
    setTimeout(() => {
      setActiveScenarioId(newScenarioId);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsScenarioTransitioning(false);
        }, 50);
      });
    }, 150);
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  const updateActiveScenario = (updater: (s: Scenario) => Scenario) => {
    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? updater(s) : s));
  };

  // Scenario Actions
  const addScenario = () => {
    const newId = Date.now().toString();
    const newScenario: Scenario = {
      id: newId,
      name: `新方案 ${scenarios.length + 1}`,
      indicators: [],
      materials: []
    };
    setIsScenarioTransitioning(true);
    setTimeout(() => {
      setScenarios(prev => [...prev, newScenario]);
      setActiveScenarioId(newId);
      setCurrentView('configuration');
      setActiveTab('configuration');
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsScenarioTransitioning(false);
        }, 50);
      });
    }, 150);
  };

  const handleImportScenario = (importedData: Scenario) => {
    const importCount = scenarios.filter(s => s.name.startsWith('导入方案')).length + 1;
    const newScenario: Scenario = {
      ...importedData,
      id: Date.now().toString(),
      name: `导入方案${importCount}`
    };
    setIsScenarioTransitioning(true);
    setIsSidebarOpen(false);
    setTimeout(() => {
      setScenarios(prev => [...prev, newScenario]);
      setActiveScenarioId(newScenario.id);
      setCurrentView('configuration');
      setActiveTab('configuration');
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsScenarioTransitioning(false);
        }, 50);
      });
    }, 150);
  };

  const deleteScenario = (id: string) => {
    const newScenarios = scenarios.filter(s => s.id !== id);
    setScenarios(newScenarios);
    if (activeScenarioId === id) {
      setActiveScenarioId(newScenarios[0].id);
    }
  };

  const batchDeleteScenarios = (ids: string[]) => {
    const newScenarios = scenarios.filter(s => !ids.includes(s.id));
    if (newScenarios.length === 0) {
      const newId = Date.now().toString();
      const defaultScenario: Scenario = {
        id: newId,
        name: '默认方案',
        indicators: [],
        materials: []
      };
      setScenarios([defaultScenario]);
      setActiveScenarioId(newId);
    } else {
      setScenarios(newScenarios);
      if (ids.includes(activeScenarioId)) {
        setActiveScenarioId(newScenarios[0].id);
      }
    }
  };

  const renameScenario = (id: string, name: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleSaveManualRatios = (ratios: Record<string, number>) => {
    updateActiveScenario(s => ({ ...s, savedManualRatios: ratios }));
  };

  const handleSaveOptimizationResult = (result: OptimizationResult | null) => {
    updateActiveScenario(s => ({ ...s, savedOptimizationResult: result }));
  };

  // 渲染主内容区域
  const renderContent = () => {
    // 移动端：根据 activeTab 渲染
    if (!isDesktop) {
      switch (activeTab) {
        case 'configuration':
          return (
            <ConfigurationView
              indicators={activeScenario.indicators}
              materials={activeScenario.materials}
              onIndicatorsChange={(inds) => updateActiveScenario(s => ({ ...s, indicators: inds }))}
              onMaterialsChange={(mats) => updateActiveScenario(s => ({ ...s, materials: mats }))}
            />
          );
        case 'calculation':
          return (
            <CalculationView
              key={activeScenario.id}
              materials={activeScenario.materials}
              indicators={activeScenario.indicators}
              savedRatios={activeScenario.savedManualRatios}
              savedResult={activeScenario.savedOptimizationResult}
              onSaveRatios={handleSaveManualRatios}
              onSaveResult={handleSaveOptimizationResult}
            />
          );
        case 'scenarios':
          return (
            <ScenariosView
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onSelect={handleScenarioChange}
              onAdd={addScenario}
              onImport={handleImportScenario}
              onDelete={deleteScenario}
              onBatchDelete={batchDeleteScenarios}
              onRename={renameScenario}
            />
          );
        default:
          return null;
      }
    }

    // 桌面端：根据 currentView 渲染
    switch (currentView) {
      case 'configuration':
        return (
          <ConfigurationView
            indicators={activeScenario.indicators}
            materials={activeScenario.materials}
            onIndicatorsChange={(inds) => updateActiveScenario(s => ({ ...s, indicators: inds }))}
            onMaterialsChange={(mats) => updateActiveScenario(s => ({ ...s, materials: mats }))}
          />
        );
      case 'calculation':
        return (
          <CalculationView
            key={activeScenario.id}
            materials={activeScenario.materials}
            indicators={activeScenario.indicators}
            savedRatios={activeScenario.savedManualRatios}
            savedResult={activeScenario.savedOptimizationResult}
            onSaveRatios={handleSaveManualRatios}
            onSaveResult={handleSaveOptimizationResult}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* PC 端：侧边栏常驻 */}
      {isDesktop && (
        <Sidebar
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onSelect={handleScenarioChange}
          onAdd={addScenario}
          onImport={handleImportScenario}
          onDelete={deleteScenario}
          onBatchDelete={batchDeleteScenarios}
          onRename={renameScenario}
          isOpen={true}
          setIsOpen={() => {}}
          statusBarHeight={statusBarHeight}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header
          className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 flex items-center px-4 justify-between shrink-0 z-10 transition-colors duration-200"
          style={{
            paddingTop: `${statusBarHeight}px`,
            minHeight: `${56 + statusBarHeight}px`
          }}
        >
          <div className="flex items-center gap-3 h-14">
            <div className="flex items-center gap-2 overflow-hidden">
              <Box className="text-blue-600 dark:text-blue-500 shrink-0" size={22} />
              <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate">
                {activeScenario.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 h-14 shrink-0">
            {/* PC 端：视图切换 Tab */}
            {isDesktop && (
              <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                <button
                  onClick={() => handleViewChange('configuration')}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-95 transform
                    ${currentView === 'configuration'
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}
                  `}
                >
                  <ClipboardList size={16} />
                  <span>{t('nav.configuration')}</span>
                </button>
                <button
                  onClick={() => handleViewChange('calculation')}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-95 transform
                    ${currentView === 'calculation'
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}
                  `}
                >
                  <Activity size={16} />
                  <span>{t('nav.calculation')}</span>
                </button>
              </nav>
            )}

            {/* 设置按钮 */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer active:scale-95 transform"
              title={t('settings.title')}
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 flex flex-col"
          style={{
            paddingBottom: isDesktop ? undefined : 'calc(4.5rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div
            className={`
               flex-1
               transition-all duration-200 ease-out
               will-change-[transform,opacity]
               ${isViewTransitioning || isScenarioTransitioning
                ? 'opacity-0 translate-y-3'
                : 'opacity-100 translate-y-0'}
             `}
          >
            {renderContent()}
          </div>
          {/* Footer - 仅桌面端显示 */}
          {isDesktop && (
            <footer className="mt-12 text-center text-xs text-slate-400 dark:text-slate-600 space-y-1 pb-2">
              <p>
                <a href="https://github.com/JVxie/Optmix" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors font-medium">OptiMix</a> v2.2.0 · © <a href="https://jvxie.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors font-medium">JVxie</a> 2026
              </p>
              <p className="opacity-75 scale-90">{t('footer.generatedBy')}</p>
            </footer>
          )}
        </main>
      </div>

      {/* 移动端：底部 Tab Bar */}
      {!isDesktop && (
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* 设置面板 */}
      <AdaptivePanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={t('settings.title')}
      >
        <SettingsPanel
          theme={theme}
          onThemeChange={setTheme}
        />
      </AdaptivePanel>
    </div>
  );
}

export default App;

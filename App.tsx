import React, { useState, useEffect } from 'react';
import { Menu, Settings, Activity, Box, Sun, Moon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SafeArea } from 'capacitor-plugin-safe-area';
import Sidebar from './components/Sidebar';
import ConfigurationView from './components/ConfigurationView';
import CalculationView from './components/CalculationView';
import { Scenario, ViewMode, OptimizationResult } from './types';

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
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem('optimix_scenarios');
    return saved ? JSON.parse(saved) : INITIAL_SCENARIOS;
  });
  
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  const [currentView, setCurrentView] = useState<ViewMode>('configuration');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // ✅ 视图切换动画状态
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  
  // ✅ 方案切换动画状态
  const [isScenarioTransitioning, setIsScenarioTransitioning] = useState(false);

  // 状态栏高度状态
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme as 'light' | 'dark';
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
          
          console.log('Safe area insets:', safeAreaData.insets);
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

  // 更新状态栏样式（根据主题）
  useEffect(() => {
    const updateStatusBarStyle = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          if (theme === 'dark') {
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
  }, [theme]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Persistence
  useEffect(() => {
    localStorage.setItem('optimix_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  // ✅ 修改：视图切换动画处理
  const handleViewChange = (newView: ViewMode) => {
    if (newView === currentView || isViewTransitioning) return;
    
    // 开始淡出动画
    setIsViewTransitioning(true);
    
    // 等待淡出完成后切换视图
    setTimeout(() => {
      setCurrentView(newView);
      
      // 使用 requestAnimationFrame 确保 DOM 更新后再淡入
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsViewTransitioning(false);
        }, 50);
      });
    }, 200);
  };

  // ✅ 新增：方案切换动画处理
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
    // ✅ 添加过渡动画
    setIsScenarioTransitioning(true);
    setTimeout(() => {
      setScenarios(prev => [...prev, newScenario]);
      setActiveScenarioId(newId);
      setCurrentView('configuration');
      
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
    
    // ✅ 添加过渡动画
    setIsScenarioTransitioning(true);
    setIsSidebarOpen(false);
    
    setTimeout(() => {
      setScenarios(prev => [...prev, newScenario]);
      setActiveScenarioId(newScenario.id);
      setCurrentView('configuration');
      
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

  // ✅ 直接使用 currentView
  const renderContent = () => {
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelect={handleScenarioChange}
        onAdd={addScenario}
        onImport={handleImportScenario}
        onDelete={deleteScenario}
        onBatchDelete={batchDeleteScenarios}
        onRename={renameScenario}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        statusBarHeight={statusBarHeight}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header 
          className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 justify-between shrink-0 z-10 transition-colors duration-200"
          style={{
            paddingTop: `${statusBarHeight}px`,
            minHeight: `${64 + statusBarHeight}px`
          }}
        >
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Box className="text-blue-600 dark:text-blue-500 hidden sm:block" size={24} />
              <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-none">
                {activeScenario.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 h-16">
            {/* Module Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button
                onClick={() => handleViewChange('configuration')}
                className={`
                  flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                  ${currentView === 'configuration' 
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}
                `}
              >
                <Settings size={16} />
                <span className="hidden sm:inline">配置</span>
              </button>
              <button
                onClick={() => handleViewChange('calculation')}
                className={`
                  flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                  ${currentView === 'calculation' 
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'}
                `}
              >
                <Activity size={16} />
                <span className="hidden sm:inline">计算</span>
              </button>
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        {/* ✅ Scrollable Content - 优化动画 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
           <div 
             className={`
               flex-1 
               transition-all duration-200 ease-out
               will-change-[transform,opacity]
               ${isViewTransitioning  || isScenarioTransitioning
                 ? 'opacity-0 translate-y-3' 
                 : 'opacity-100 translate-y-0'}
             `}
           >
             {renderContent()}
           </div>
           <footer 
             className="mt-12 text-center text-xs text-slate-400 dark:text-slate-600 space-y-1"
             style={{
               paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))'
             }}
           >
              <p>
                © <a href="https://jvxie.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors font-medium">JVxie</a> 2026
              </p>
              <p className="opacity-75 scale-90">Generated by Gemini</p>
           </footer>
        </main>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Globe, ExternalLink, Info, ChevronDown, Check, Download, Share } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsPanelProps {
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
}

interface Option {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const Icon = selectedOption?.icon || options[0].icon;

  return (
    <div className="relative" ref={containerRef}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 pointer-events-none z-30">
        <Icon size={18} />
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border transition-all duration-200 rounded-xl text-sm text-left flex items-center justify-between shadow-sm
          ${isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 z-20 relative'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
          text-slate-800 dark:text-slate-100`}
      >
        <span className="font-medium truncate">{selectedOption?.label}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                  ${value === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <option.icon size={16} className={value === option.value ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                  <span>{option.label}</span>
                </div>
                {value === option.value && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const sectionTitleClassName =
  'text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ theme, onThemeChange }) => {
  const { t, i18n } = useTranslation();
  const { canInstall, isIOS, install } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await install();
    }
  };

  const themeOptions: Option[] = [
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
    { value: 'system', label: t('settings.themeSystem'), icon: Monitor },
  ];

  const langOptions: Option[] = [
    { value: 'zh-CN', label: t('settings.langZh'), icon: Globe },
    { value: 'en-US', label: t('settings.langEn'), icon: Globe },
  ];

  return (
    <div className="space-y-8 py-2">
      {/* 主题设置 */}
      <div>
        <h4 className={sectionTitleClassName}>
          {t('settings.theme')}
        </h4>
        <CustomSelect
          value={theme}
          onChange={(val) => onThemeChange(val as ThemeOption)}
          options={themeOptions}
        />
      </div>

      {/* 语言设置 */}
      <div>
        <h4 className={sectionTitleClassName}>
          {t('settings.language')}
        </h4>
        <CustomSelect
          value={i18n.language}
          onChange={handleLanguageChange}
          options={langOptions}
        />
      </div>

      {/* 安装应用 - 仅在移动端浏览器中显示 */}
      {canInstall && (
        <div>
          <h4 className={sectionTitleClassName}>
            {t('settings.installApp')}
          </h4>
          <button
            onClick={handleInstall}
            className="flex items-center gap-4 w-full px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all cursor-pointer group active:scale-[0.98] transform"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Download size={20} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                {t('settings.installAppTitle')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('settings.installAppDesc')}
              </div>
            </div>
          </button>

          {/* iOS 安装引导弹窗 */}
          {showIOSGuide && (
            <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Share size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    {t('settings.iosInstallGuideTitle')}
                  </p>
                  <ol className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 list-decimal list-inside">
                    <li>{t('settings.iosInstallStep1')}</li>
                    <li>{t('settings.iosInstallStep2')}</li>
                    <li>{t('settings.iosInstallStep3')}</li>
                  </ol>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-3 w-full text-center text-xs text-amber-600 dark:text-amber-400 font-medium py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
              >
                {t('common.ok')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 关于 */}
      <div>
        <h4 className={sectionTitleClassName}>
          {t('settings.about')}
        </h4>
        <a
          href="https://github.com/JVxie/Optmix"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 w-full px-4 py-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Info size={20} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              OptiMix
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.version')} v2.2.1
            </div>
          </div>
          <ExternalLink size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
        </a>
      </div>
    </div>
  );
};

export default SettingsPanel;

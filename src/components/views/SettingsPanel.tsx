import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Globe, ExternalLink, Info } from 'lucide-react';

type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsPanelProps {
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
}

const selectClassName =
  'w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer';

const sectionTitleClassName =
  'text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ theme, onThemeChange }) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const themeIcon = theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Monitor size={16} />;

  return (
    <div className="space-y-6">
      {/* 主题设置 */}
      <div>
        <h4 className={sectionTitleClassName}>
          {t('settings.theme')}
        </h4>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
            {themeIcon}
          </div>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeOption)}
            className={`${selectClassName} pl-9`}
          >
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
            <option value="system">{t('settings.themeSystem')}</option>
          </select>
        </div>
      </div>

      {/* 语言设置 */}
      <div>
        <h4 className={sectionTitleClassName}>
          {t('settings.language')}
        </h4>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
            <Globe size={16} />
          </div>
          <select
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={`${selectClassName} pl-9`}
          >
            <option value="zh-CN">{t('settings.langZh')}</option>
            <option value="en-US">{t('settings.langEn')}</option>
          </select>
        </div>
      </div>

      {/* 关于 */}
      <div>
        <h4 className={sectionTitleClassName}>
          {t('settings.about')}
        </h4>
        <a
          href="https://github.com/JVxie/Optmix"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <Info size={18} className="text-blue-500 dark:text-blue-400 shrink-0" />
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {t('settings.about')} OptiMix
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t('settings.version')} v2.2.0
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
        </a>
      </div>
    </div>
  );
};

export default SettingsPanel;

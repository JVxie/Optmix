import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Check, X, AlertCircle, FileSpreadsheet, Download, Upload, ListChecks } from 'lucide-react';
import { Scenario } from '@/types';
import AdaptivePanel from '@/components/common/AdaptivePanel';
import { useToast } from '@/contexts/ToastContext';
import { exportScenarioToExcel, parseScenarioFromExcel } from '@/services/excelService';

interface ScenariosViewProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onImport: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onRename: (id: string, newName: string) => void;
}

const ScenariosView: React.FC<ScenariosViewProps> = ({
  scenarios,
  activeScenarioId,
  onSelect,
  onAdd,
  onImport,
  onDelete,
  onBatchDelete,
  onRename,
}) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isIOModalOpen, setIsIOModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (s: Scenario) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    if (editingId && trimmedName) {
      const isDuplicate = scenarios.some(
        s => s.name === trimmedName && s.id !== editingId
      );
      if (isDuplicate) {
        setAlertMsg(t('scenario.duplicateName', { name: trimmedName }));
        return;
      }
      onRename(editingId, trimmedName);
      setEditingId(null);
    } else {
      setAlertMsg(t('scenario.nameRequired'));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (scenarios.length <= 1) {
      showToast(t('scenario.mustKeepOne'), "error");
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setShowBatchDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    onBatchDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBatchMode(false);
    setShowBatchDeleteConfirm(false);
  };

  const handleExport = async () => {
    const activeScenario = scenarios.find(s => s.id === activeScenarioId);
    if (!activeScenario) return;
    setIsExporting(true);
    try {
      await exportScenarioToExcel(activeScenario);
      setIsIOModalOpen(false);
      if (!window.Capacitor?.isNativePlatform()) {
        setAlertMsg(t('scenario.exportSuccess', { name: activeScenario.name }));
      }
    } catch (e) {
      console.error(e);
      setAlertMsg(e instanceof Error ? e.message : t('scenario.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scenario = await parseScenarioFromExcel(file);
      onImport(scenario);
      setIsIOModalOpen(false);
      setAlertMsg(t('scenario.importSuccess'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setAlertMsg(t('scenario.importFailed', { message }));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('scenario.title')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedIds(new Set());
            }}
            className={`p-2 rounded-xl transition-colors active:scale-95 transform ${isBatchMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title={isBatchMode ? t('scenario.exitBatch') : t('scenario.batchManage')}
          >
            <ListChecks size={20} />
          </button>
        </div>
      </div>

      {/* Scenario List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => {
              if (isBatchMode) {
                toggleSelection(scenario.id);
              } else {
                onSelect(scenario.id);
              }
            }}
            className={`
              group flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-200
              active:scale-[0.98] transform
              ${activeScenarioId === scenario.id && !isBatchMode
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md ring-1 ring-blue-200 dark:ring-blue-800'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700'}
              ${isBatchMode && selectedIds.has(scenario.id)
                ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : ''}
            `}
          >
            {isBatchMode && (
              <div className="mr-3 flex items-center">
                <div
                  onClick={(e) => { e.stopPropagation(); toggleSelection(scenario.id); }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${selectedIds.has(scenario.id)
                    ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:border-blue-400 dark:hover:border-blue-400'
                    }`}
                >
                  <Check size={12} className={`text-white transform transition-transform duration-200 ${selectedIds.has(scenario.id) ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0 flex items-center justify-between">
              {editingId === scenario.id ? (
                <div className="flex items-center w-full gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 min-w-0 text-sm p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={handleSaveEdit} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 p-2 rounded-xl transition-colors active:scale-95">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 p-2 rounded-xl transition-colors active:scale-95">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">{scenario.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {t('scenario.indicatorCount', { count: scenario.indicators.length })} · {t('scenario.materialCount', { count: scenario.materials.length })}
                    </span>
                  </div>
                  {!isBatchMode && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(scenario); }}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors active:scale-95"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, scenario.id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
        {isBatchMode ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleBatchDeleteClick}
              disabled={selectedIds.size === 0}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-2xl transition-colors font-medium text-sm shadow-sm active:scale-[0.98] transform"
            >
              <Trash2 size={16} />
              {t('scenario.deleteSelected')} ({selectedIds.size})
            </button>
            <button
              onClick={() => {
                setIsBatchMode(false);
                setSelectedIds(new Set());
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-2xl transition-colors font-medium text-sm active:scale-[0.98] transform"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-2xl transition-colors font-medium text-sm shadow-sm active:scale-[0.98] transform"
            >
              <Plus size={16} />
              {t('scenario.newScenario')}
            </button>
            <button
              onClick={() => setIsIOModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-2xl transition-colors font-medium text-sm active:scale-[0.98] transform"
            >
              <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-500" />
              {t('scenario.importExport')}
            </button>
          </>
        )}
      </div>

      {/* Import/Export Panel */}
      <AdaptivePanel
        isOpen={isIOModalOpen}
        onClose={() => setIsIOModalOpen(false)}
        title={t('scenario.importExportTitle')}
      >
        <div className="space-y-6">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">{t('scenario.usageGuide')}</h4>
            <div className="pl-2 space-y-2.5">
              <p>1. <span className="font-medium text-slate-800 dark:text-slate-200">{t('scenario.step1Title')}</span>{t('scenario.step1Desc')}</p>
              <p>2. <span className="font-medium text-slate-800 dark:text-slate-200">{t('scenario.step2Title')}</span>{t('scenario.step2Desc')}</p>
              <p>3. <span className="font-medium text-slate-800 dark:text-slate-200">{t('scenario.step3Title')}</span>{t('scenario.step3Desc')}</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <h4 className="font-bold flex items-center gap-2"><AlertCircle size={16} /> {t('scenario.dataSpec')}</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-blue-700/80 dark:text-blue-300/80">
              <li><strong>{t('scenario.spec1Title')}</strong>{t('scenario.spec1Desc')}</li>
              <li><strong>{t('scenario.spec2Title')}</strong>{t('scenario.spec2Desc')}</li>
              <li><strong>{t('scenario.spec3Title')}</strong>{t('scenario.spec3Desc')}</li>
              <li><strong>{t('scenario.spec4Title')}</strong>{t('scenario.spec4Desc')}</li>
              <li><strong>{t('scenario.spec5Title')}</strong>{t('scenario.spec5Desc')}</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transform"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                {isExporting ? (
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={24} />
                )}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                {isExporting ? t('scenario.exporting') : t('scenario.exportScenario')}
              </span>
            </button>

            <button
              onClick={handleImportClick}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group active:scale-[0.98] transform"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Download size={24} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{t('scenario.importScenario')}</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </div>
      </AdaptivePanel>

      {/* Delete Confirmation */}
      <AdaptivePanel
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('scenario.deleteTitle')}
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            {t('scenario.deleteConfirm')} <span className="font-bold text-red-600 dark:text-red-400">"{scenarios.find(s => s.id === deleteId)?.name}"</span>
            <br />
            <span className="text-sm opacity-80">{t('scenario.deleteIrreversible')}</span>
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors active:scale-95 transform"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors active:scale-95 transform"
            >
              {t('common.confirmDelete')}
            </button>
          </div>
        </div>
      </AdaptivePanel>

      {/* Batch Delete Confirmation */}
      <AdaptivePanel
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        title={t('scenario.batchDeleteTitle')}
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            {t('scenario.batchDeleteConfirm')} <span className="font-bold text-red-600 dark:text-red-400">{selectedIds.size}</span> {t('scenario.batchDeleteUnit')}<br />
            <span className="text-sm opacity-80">{t('scenario.batchDeleteHint')}</span>
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowBatchDeleteConfirm(false)}
              className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors active:scale-95 transform"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmBatchDelete}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors active:scale-95 transform"
            >
              {t('common.confirmDelete')}
            </button>
          </div>
        </div>
      </AdaptivePanel>

      {/* Alert */}
      <AdaptivePanel
        isOpen={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        title={t('common.hint')}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
            <AlertCircle size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setAlertMsg(null)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors active:scale-95 transform"
            >
              {t('common.ok')}
            </button>
          </div>
        </div>
      </AdaptivePanel>
    </div>
  );
};

export default ScenariosView;

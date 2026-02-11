
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Material, Indicator } from '@/types';
import { Plus, Trash2, Edit2, AlertCircle, ListChecks, Check } from 'lucide-react';
import AdaptivePanel from '@/components/common/AdaptivePanel';

interface Props {
  materials: Material[];
  indicators: Indicator[];
  onChange: (materials: Material[]) => void;
}

const inputClass = "w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";

const MaterialManager: React.FC<Props> = ({ materials, indicators, onChange }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Batch Mode
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    values: Record<string, string>
  }>({
    name: '',
    price: '',
    values: {}
  });
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', values: {} });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingId(mat.id);
    const valuesStr: Record<string, string> = {};
    Object.keys(mat.indicatorValues).forEach(k => {
      valuesStr[k] = String(mat.indicatorValues[k]);
    });

    setFormData({
      name: mat.name,
      price: String(mat.price),
      values: valuesStr
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const name = formData.name.trim();

    // 1. Check Basic Fields
    if (!name) {
      setError(t('material.nameRequired'));
      return;
    }

    if (!formData.price || formData.price.trim() === '') {
      setError(t('material.priceRequired'));
      return;
    }

    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice)) {
      setError(t('material.priceInvalid'));
      return;
    }

    // 2. Check Duplicate Name
    const isDuplicate = materials.some(
      m => m.name === name && m.id !== editingId
    );
    if (isDuplicate) {
      setError(t('material.duplicateName', { name }));
      return;
    }

    // 3. Check Indicator Values
    const indicatorValues: Record<string, number> = {};
    for (const ind of indicators) {
      const valStr = formData.values[ind.id];
      if (valStr === undefined || valStr === '' || valStr === null) {
        setError(t('material.indicatorRequired', { name: ind.name }));
        return;
      }
      const val = parseFloat(valStr);
      if (isNaN(val)) {
        setError(t('material.indicatorInvalid', { name: ind.name }));
        return;
      }
      indicatorValues[ind.id] = val;
    }

    if (editingId) {
      // Update
      const updatedMat: Material = {
        id: editingId,
        name: name,
        price: parsedPrice,
        indicatorValues
      };
      onChange(materials.map(m => m.id === editingId ? updatedMat : m));
    } else {
      // Create
      const newMat: Material = {
        id: Date.now().toString(),
        name: name,
        price: parsedPrice,
        indicatorValues
      };
      onChange([...materials, newMat]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onChange(materials.filter(m => m.id !== deleteId));
      setDeleteId(null);
    }
  };

  // Batch Operations
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === materials.length && materials.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(materials.map(m => m.id)));
    }
  };

  const confirmBatchDelete = () => {
    onChange(materials.filter(m => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    setIsBatchMode(false);
    setShowBatchDeleteConfirm(false);
  };

  const isAllSelected = selectedIds.size === materials.length && materials.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center h-10">
        {isBatchMode ? (
          <div
            className="flex items-center gap-2 animate-in fade-in duration-200 cursor-pointer group"
            onClick={toggleSelectAll}
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${isAllSelected
                ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 group-hover:border-emerald-400 dark:group-hover:border-emerald-400'
              }`}>
              <Check size={12} className={`text-white transform transition-transform duration-200 ${isAllSelected ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium select-none">{t('common.selectAll')} ({selectedIds.size}/{materials.length})</span>
          </div>
        ) : <div></div>}

        <div className="flex gap-2">
          {isBatchMode ? (
            <>
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                disabled={selectedIds.size === 0}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Trash2 size={16} /> {t('common.delete')} ({selectedIds.size})
              </button>
              <button
                onClick={() => {
                  setIsBatchMode(false);
                  setSelectedIds(new Set());
                }}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {t('common.done')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsBatchMode(true)}
                className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <ListChecks size={18} /> {t('common.batch')}
              </button>
              <button
                onClick={openAddModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={16} /> {t('common.add')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto pb-4 pr-1 flex-1 content-start">
        {materials.map(mat => (
          <div
            key={mat.id}
            onClick={() => isBatchMode && toggleSelection(mat.id)}
            className={`group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border transition-all duration-200 relative overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transform
             ${isBatchMode && selectedIds.has(mat.id)
                ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400 dark:ring-emerald-600'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'}
            `}
          >
            {isBatchMode && (
              <div className="absolute top-4 left-4 z-10">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${selectedIds.has(mat.id)
                      ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:border-emerald-400 dark:hover:border-emerald-400'
                    }`}
                >
                  <Check size={12} className={`text-white transform transition-transform duration-200 ${selectedIds.has(mat.id) ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                </div>
              </div>
            )}

            <div className={`p-5 flex-1 transition-all ${isBatchMode ? 'pl-10' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{mat.name}</h4>
                <div className="flex gap-2">
                  <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    ¥{mat.price}{t('common.perTon')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                {indicators.slice(0, 4).map(ind => (
                  <div key={ind.id} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{ind.name}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {mat.indicatorValues[ind.id]} <span className="text-xs text-slate-400 dark:text-slate-500">{ind.unit}</span>
                    </span>
                  </div>
                ))}
                {indicators.length > 4 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">{t('material.andMore', { count: indicators.length - 4 })}</p>
                )}
                {indicators.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">{t('material.noIndicatorData')}</p>
                )}
              </div>
            </div>

            {!isBatchMode && (
              <div className="border-t border-slate-100 dark:border-slate-700 p-2 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditModal(mat); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Edit2 size={14} /> {t('common.edit')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(mat.id); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        {materials.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            {t('material.empty')}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AdaptivePanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('material.editTitle') : t('material.addTitle')}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('material.name')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputClass}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('material.namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('material.price')} <span className="text-red-500">*</span></label>
              <input
                type="number"
                className={inputClass}
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder={t('material.pricePlaceholder')}
              />
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-1">{t('material.indicatorParams')}</h4>
            {indicators.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-2 rounded">{t('material.noIndicatorHint')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {indicators.map(ind => (
                  <div key={ind.id}>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{ind.name} ({ind.unit}) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      className={inputClass}
                      value={formData.values[ind.id] !== undefined ? formData.values[ind.id] : ''}
                      onChange={e => setFormData({
                        ...formData,
                        values: { ...formData.values, [ind.id]: e.target.value }
                      })}
                      placeholder="数值"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </AdaptivePanel>

      {/* Delete Confirmation Modal */}
      <AdaptivePanel
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('material.deleteTitle')}
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            {t('material.deleteConfirm')} <span className="font-bold text-red-600 dark:text-red-400">"{materials.find(m => m.id === deleteId)?.name}"</span> 吗？
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.confirmDelete')}
            </button>
          </div>
        </div>
      </AdaptivePanel>

      {/* Batch Delete Confirmation Modal */}
      <AdaptivePanel
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        title={t('material.batchDeleteTitle')}
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            {t('material.batchDeleteConfirm')} <span className="font-bold text-red-600 dark:text-red-400">{selectedIds.size}</span> {t('material.batchDeleteUnit')}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowBatchDeleteConfirm(false)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmBatchDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.confirmDelete')}
            </button>
          </div>
        </div>
      </AdaptivePanel>
    </div>
  );
};

export default MaterialManager;

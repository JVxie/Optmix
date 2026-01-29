
import React, { useState } from 'react';
import { Indicator } from '../types';
import { Plus, Trash2, Edit2, AlertCircle, ListChecks, Check } from 'lucide-react';
import Modal from './Modal';

interface Props {
  indicators: Indicator[];
  onChange: (indicators: Indicator[]) => void;
}

const inputClass = "w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";

const IndicatorManager: React.FC<Props> = ({ indicators, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Batch Mode
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Indicator>>({ 
    name: '', unit: '', min: 0, max: 100 
  });
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', unit: '', min: 0, max: 100 });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (ind: Indicator) => {
    setEditingId(ind.id);
    setFormData({ ...ind });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const name = formData.name?.trim();
    const unit = formData.unit?.trim();

    // 1. Check Empty Fields
    if (!name) {
      setError('请输入指标名称');
      return;
    }
    if (!unit) {
      setError('请输入单位');
      return;
    }
    if (formData.min === undefined || formData.min === null || String(formData.min) === '') {
      setError('请输入最小值');
      return;
    }
    if (formData.max === undefined || formData.max === null || String(formData.max) === '') {
      setError('请输入最大值');
      return;
    }

    // 2. Check Logical Validity
    if (Number(formData.min) > Number(formData.max)) {
      setError('最小值不能大于最大值');
      return;
    }

    // 3. Check Duplicate Name
    const isDuplicate = indicators.some(
      ind => ind.name === name && ind.id !== editingId
    );
    if (isDuplicate) {
      setError(`指标名称 "${name}" 已存在，请更换名称`);
      return;
    }

    if (editingId) {
      // Edit Mode
      onChange(indicators.map(i => i.id === editingId ? { ...i, ...formData, name, unit } as Indicator : i));
    } else {
      // Add Mode
      const newItem: Indicator = {
        id: Date.now().toString(),
        name: name!,
        unit: unit!,
        min: Number(formData.min),
        max: Number(formData.max),
      };
      onChange([...indicators, newItem]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onChange(indicators.filter(i => i.id !== deleteId));
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
    if (selectedIds.size === indicators.length && indicators.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(indicators.map(i => i.id)));
    }
  };

  const confirmBatchDelete = () => {
    onChange(indicators.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setIsBatchMode(false);
    setShowBatchDeleteConfirm(false);
  };

  const isAllSelected = selectedIds.size === indicators.length && indicators.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center h-10">
         {isBatchMode ? (
            <div 
              className="flex items-center gap-2 animate-in fade-in duration-200 cursor-pointer group"
              onClick={toggleSelectAll}
            >
               <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                 isAllSelected
                 ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                 : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 group-hover:border-blue-400 dark:group-hover:border-blue-400'
               }`}>
                 <Check size={12} className={`text-white transform transition-transform duration-200 ${isAllSelected ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
               </div>
               <span className="text-sm text-slate-500 dark:text-slate-400 font-medium select-none">全选 ({selectedIds.size}/{indicators.length})</span>
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
                    <Trash2 size={16} /> 删除 ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => {
                      setIsBatchMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    完成
                  </button>
               </>
            ) : (
              <>
                 <button
                   onClick={() => setIsBatchMode(true)}
                   className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                 >
                   <ListChecks size={18} /> 批量
                 </button>
                 <button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={16} /> 新增
                  </button>
              </>
            )}
         </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 pb-4 flex-1">
        {indicators.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            暂无指标，请点击上方按钮添加
          </div>
        ) : (
          indicators.map((ind) => (
            <div 
              key={ind.id} 
              onClick={() => isBatchMode && toggleSelection(ind.id)}
              className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-colors cursor-pointer relative
                ${isBatchMode && selectedIds.has(ind.id) 
                  ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-400 dark:ring-blue-600' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'}
              `}
            >
              {/* Batch Mode Checkbox Overlay */}
              {isBatchMode && (
                 <div className="absolute top-4 left-4 z-10">
                    <div 
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                        selectedIds.has(ind.id)
                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:border-blue-400 dark:hover:border-blue-400'
                      }`}
                    >
                      <Check size={12} className={`text-white transform transition-transform duration-200 ${selectedIds.has(ind.id) ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                    </div>
                 </div>
              )}

              <div className={`flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all ${isBatchMode ? 'pl-8' : ''}`}>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-0.5">名称</label>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{ind.name}</div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-0.5">单位</label>
                  <div className="text-slate-600 dark:text-slate-300 font-medium">{ind.unit}</div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-0.5">最小值</label>
                  <div className="text-slate-600 dark:text-slate-300 font-mono">{ind.min}</div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 dark:text-slate-500 mb-0.5">最大值</label>
                  <div className="text-slate-600 dark:text-slate-300 font-mono">{ind.max}</div>
                </div>
              </div>
              
              {!isBatchMode && (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(ind); }}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="修改"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(ind.id); }}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? '修改指标' : '新增指标'}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">指标名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputClass}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：水分"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">单位 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputClass}
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="如：%"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">最小值 <span className="text-red-500">*</span></label>
              <input
                type="number"
                className={inputClass}
                value={formData.min}
                onChange={e => setFormData({ ...formData, min: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">最大值 <span className="text-red-500">*</span></label>
              <input
                type="number"
                className={inputClass}
                value={formData.max}
                onChange={e => setFormData({ ...formData, max: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              保存
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="删除指标确认"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            确定要删除指标 <span className="font-bold text-red-600 dark:text-red-400">“{indicators.find(i => i.id === deleteId)?.name}”</span> 吗？
            <br/>
            <span className="text-sm opacity-80">将会同时删除所有货物中对应的该项指标数据。</span>
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Batch Delete Confirmation Modal */}
      <Modal
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        title="批量删除确认"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            确定要删除选中的 <span className="font-bold text-red-600 dark:text-red-400">{selectedIds.size}</span> 个指标吗？<br/>
            这将同时删除所有货物中对应的该项指标数据。
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowBatchDeleteConfirm(false)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmBatchDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IndicatorManager;

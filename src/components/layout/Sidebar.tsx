import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronLeft, AlertCircle, FileSpreadsheet, Download, Upload, ListChecks } from 'lucide-react';
import { Scenario } from '@/types';
import Modal from '@/components/common/Modal';
import { exportScenarioToExcel, parseScenarioFromExcel } from '@/services/excelService';

interface SidebarProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onImport: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onRename: (id: string, newName: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  statusBarHeight?: number; // ✅ 新增：接收状态栏高度
}

const Sidebar: React.FC<SidebarProps> = ({
  scenarios,
  activeScenarioId,
  onSelect,
  onAdd,
  onImport,
  onDelete,
  onBatchDelete,
  onRename,
  isOpen,
  setIsOpen,
  statusBarHeight = 0 // ✅ 默认值为 0
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // States for custom modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isIOModalOpen, setIsIOModalOpen] = useState(false);

  // 新增：导出中状态
  const [isExporting, setIsExporting] = useState(false);

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
        setAlertMsg(`方案名称 "${trimmedName}" 已存在，请更换名称。`);
        return;
      }

      onRename(editingId, trimmedName);
      setEditingId(null);
    } else {
      setAlertMsg("请输入方案名称。");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (scenarios.length <= 1) {
      setAlertMsg("必须至少保留一个方案");
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

  // Batch Operations
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
        setAlertMsg(`方案 "${activeScenario.name}" 导出成功！`);
      }
    } catch (e) {
      console.error(e);
      setAlertMsg(e instanceof Error ? e.message : "导出失败，请重试。");
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
      setAlertMsg("方案导入成功！");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setAlertMsg(`导入失败: ${message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out
        w-72 md:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
      `}>
        {/* ✅ 修改：侧边栏头部添加状态栏高度 padding */}
        <div
          className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900"
          style={{ paddingTop: `calc(1rem + ${statusBarHeight}px)` }}
        >
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">方案管理</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedIds(new Set());
              }}
              className={`p-1.5 rounded-lg transition-colors ${isBatchMode ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title={isBatchMode ? "退出批量管理" : "批量管理"}
            >
              <ListChecks size={20} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-slate-500 dark:text-slate-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => {
                if (isBatchMode) {
                  toggleSelection(scenario.id);
                } else {
                  onSelect(scenario.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }
              }}
              className={`
                group min-h-[52px] flex items-center p-2 rounded-lg cursor-pointer transition-colors
                ${activeScenarioId === scenario.id && !isBatchMode
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-transparent'}
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
                      className="flex-1 min-w-0 text-sm p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={handleSaveEdit} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 p-2 rounded-lg transition-colors">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 p-2 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="font-medium truncate px-1">{scenario.name}</span>
                    {!isBatchMode && (
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(scenario); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, scenario.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3">
          {isBatchMode ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleBatchDeleteClick}
                disabled={selectedIds.size === 0}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                <Trash2 size={16} />
                删除选中 ({selectedIds.size})
              </button>
              <button
                onClick={() => {
                  setIsBatchMode(false);
                  setSelectedIds(new Set());
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-lg transition-colors font-medium text-sm"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onAdd}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white py-2.5 px-4 rounded-lg transition-colors font-medium text-sm"
              >
                <Plus size={16} />
                新建方案
              </button>

              <button
                onClick={() => setIsIOModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-lg transition-colors font-medium text-sm"
              >
                <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-500" />
                导入 / 导出
              </button>
            </>
          )}
        </div>
      </div>

      {/* Import/Export Modal */}
      <Modal
        isOpen={isIOModalOpen}
        onClose={() => setIsIOModalOpen(false)}
        title="导入 / 导出方案"
      >
        <div className="space-y-6">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">使用说明：</h4>
            <div className="pl-2 space-y-2.5">
              <p>1. <span className="font-medium text-slate-800 dark:text-slate-200">导出模板</span>：点击"导出方案"，将选择的方案数据保存为 Excel 文件。强烈建议以此文件作为编辑模板。</p>
              <p>2. <span className="font-medium text-slate-800 dark:text-slate-200">编辑数据</span>：在 Excel 中编辑。您可以调整数值，或严格按照原有格式新增指标列与货物行。</p>
              <p>3. <span className="font-medium text-slate-800 dark:text-slate-200">导入方案</span>：将编辑好的文件上传，系统将自动识别并生成一个新的方案副本。</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <h4 className="font-bold flex items-center gap-2"><AlertCircle size={16} /> 数据规范与注意事项</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-blue-700/80 dark:text-blue-300/80">
              <li><strong>模板规范：</strong>强烈建议先执行"导出"操作获取标准模板，在此基础上进行数据编辑。</li>
              <li><strong>表头锁定：</strong>请勿修改 Excel 第一行的表头名称（指标名称、货物名称等），否则无法识别。</li>
              <li><strong>工作表完整性：</strong>必须包含"指标管理"和"货物管理"两个工作表，且名称不可更改。</li>
              <li><strong>数据格式：</strong>数值单元格仅支持数字，请勿添加货币符号或文本备注；空白单元格可能导致错误。</li>
              <li><strong>方案独立性：</strong>导入操作将生成一个新的方案副本，不会覆盖您当前已有的任何方案。</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                {isExporting ? (
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={24} />
                )}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                {isExporting ? '导出中...' : '导出方案'}
              </span>
            </button>

            <button
              onClick={handleImportClick}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Download size={24} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">导入方案</span>
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
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="删除方案确认"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            确定要删除方案 <span className="font-bold text-red-600 dark:text-red-400">“{scenarios.find(s => s.id === deleteId)?.name}”</span> 吗？
            <br />
            <span className="text-sm opacity-80">此操作无法撤销。</span>
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
            确定要删除选中的 <span className="font-bold text-red-600 dark:text-red-400">{selectedIds.size}</span> 个方案吗？<br />
            <span className="text-sm opacity-80">注意：若所有方案被删除，系统将自动创建一个默认新方案。</span>
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

      {/* Alert Modal */}
      <Modal
        isOpen={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        title="提示"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-600">
            <AlertCircle size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setAlertMsg(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;

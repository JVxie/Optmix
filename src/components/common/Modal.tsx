import React, { useEffect, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // 控制实际渲染和动画状态
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // ✅ 使用 useLayoutEffect 确保 DOM 同步更新后再触发动画
  useLayoutEffect(() => {
    let openTimeoutId: ReturnType<typeof setTimeout>;
    let closeTimeoutId: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      // 打开：先渲染 DOM
      setShouldRender(true);
    } else if (shouldRender) {
      // 关闭：先触发退出动画
      setIsVisible(false);
      // 等待动画完成后再卸载 DOM
      closeTimeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
    
    return () => {
      clearTimeout(openTimeoutId);
      clearTimeout(closeTimeoutId);
    };
  }, [isOpen]);

  // ✅ 单独处理入场动画，确保 DOM 已经渲染
  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (shouldRender && isOpen) {
      // 使用 requestAnimationFrame + setTimeout 双重保证
      // 这在移动端浏览器中更可靠
      animationFrameId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, 20); // 稍微延长一点，给安卓更多渲染时间
      });
    }
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [shouldRender, isOpen]);

  // ESC 键关闭 & 锁定滚动
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [shouldRender, onClose]);

  if (!shouldRender) return null;

  // 使用 React Portal 将 Modal 渲染到 body 根节点
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* 背景遮罩 - 添加 will-change 优化动画性能 */}
      <div 
        className={`
          absolute inset-0 bg-slate-900/60 backdrop-blur-sm 
          transition-opacity duration-300 ease-out will-change-[opacity]
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />
      
      {/* 弹窗主体 - 添加 will-change 优化动画性能 */}
      <div 
        className={`
          relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl 
          w-full max-w-lg flex flex-col max-h-[85vh] 
          border border-slate-200 dark:border-slate-700
          transition-all duration-300 ease-out 
          will-change-[transform,opacity]
          ${isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <div className="p-6 overflow-y-auto text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

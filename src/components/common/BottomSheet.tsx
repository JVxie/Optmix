import React, { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    let closeTimeoutId: ReturnType<typeof setTimeout>;

    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      setIsVisible(false);
      closeTimeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      clearTimeout(closeTimeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    if (shouldRender && isOpen) {
      animationFrameId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, 20);
      });
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [shouldRender, isOpen]);

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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* 背景遮罩 */}
      <div
        className={`
          absolute inset-0 bg-black/50 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* 底部面板 */}
      <div
        className={`
          relative bg-white dark:bg-slate-800 w-full
          rounded-t-2xl shadow-2xl
          flex flex-col max-h-[90vh]
          transition-transform duration-300 ease-out
          will-change-transform
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* 拖拽指示条 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;

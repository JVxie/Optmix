import React, { useEffect, useState, useLayoutEffect, useRef, useCallback } from 'react';
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

  // 手势相关状态
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);
  const isDragFromHandle = useRef(false);

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

  // 手势处理：触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    currentTranslateY.current = 0;
    isDragging.current = false;

    // 判断触摸是否从拖拽手柄/标题区域开始
    const target = e.target as HTMLElement;
    const handle = target.closest('[data-drag-handle]');
    isDragFromHandle.current = !!handle;
  }, []);

  // 手势处理：触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY.current;

    // 只允许下滑
    if (deltaY < 0) {
      currentTranslateY.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
        sheetRef.current.style.transition = 'none';
      }
      return;
    }

    // 如果触摸不是从手柄开始，检查内容区域是否还有滚动空间
    if (!isDragFromHandle.current && contentRef.current) {
      const scrollTop = contentRef.current.scrollTop;
      if (scrollTop > 0) {
        // 内容区还未滚动到顶部，不拦截
        return;
      }
    }

    isDragging.current = true;

    // 阻尼效果：下滑越远阻力越大
    const damping = 0.6;
    const dampedDelta = deltaY * damping;
    currentTranslateY.current = dampedDelta;

    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dampedDelta}px)`;
      sheetRef.current.style.transition = 'none';
    }

    // 防止页面滚动
    if (deltaY > 10) {
      e.preventDefault();
    }
  }, []);

  // 手势处理：触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 100; // 超过 100px 则关闭

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
    }

    if (currentTranslateY.current > threshold) {
      // 超过阈值：关闭
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(100%)';
      }
      setTimeout(() => {
        onClose();
        // 重置
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
          sheetRef.current.style.transition = '';
        }
      }, 300);
    } else {
      // 未超过阈值：弹回
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
      }
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = '';
        }
      }, 300);
    }

    currentTranslateY.current = 0;
  }, [onClose]);

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
        ref={sheetRef}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 拖拽指示条 + 标题（可拖拽区域） */}
        <div data-drag-handle>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center px-5 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="p-5 overflow-y-auto text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;

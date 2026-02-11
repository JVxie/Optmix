import React from 'react';
import Modal from './Modal';
import BottomSheet from './BottomSheet';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface AdaptivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * 自适应面板组件
 * - 桌面端 (>= 1024px): 显示为居中 Modal
 * - 移动端 (< 1024px): 显示为底部 BottomSheet
 */
const AdaptivePanel: React.FC<AdaptivePanelProps> = ({ isOpen, onClose, title, children }) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        {children}
      </Modal>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </BottomSheet>
  );
};

export default AdaptivePanel;

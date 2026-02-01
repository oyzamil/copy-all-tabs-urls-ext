import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

export interface ModalProps extends Omit<AntModalProps, 'open' | 'onCancel'> {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
}

// Only memo the whole component if parent re-renders often
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  styles,
  ...restProps
}) => {
  return (
    <AntModal
      className={cn(className)}
      open={isOpen}
      onCancel={onClose}
      styles={styles}
      {...restProps}
    >
      {children}
    </AntModal>
  );
};

export default Modal;

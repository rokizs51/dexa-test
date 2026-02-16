import { cn } from '../lib/utils';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-950/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-white rounded-xl shadow-xl overflow-hidden w-full max-h-[90vh] flex flex-col',
          {
            'max-w-md': size === 'sm',
            'max-w-lg': size === 'md',
            'max-w-2xl': size === 'lg',
            'max-w-4xl': size === 'xl',
          }
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
          <h3 className="text-lg font-semibold text-brown-900">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-brown-100 bg-brown-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-brown-600">{message}</p>
    </Modal>
  );
}

export default Modal;

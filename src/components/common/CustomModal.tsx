import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './CustomModal.css';

interface CustomModalProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  height?: number;
  onClose: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  title,
  children,
  footer,
  width = 500,
  height,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const modalContent = (
    <div className="custom-modal-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div 
        className="custom-modal" 
        ref={modalRef}
        style={{ 
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
        }}
      >
        <div className="custom-modal-header">
          <h2 className="custom-modal-title">{title}</h2>
          <button className="custom-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="custom-modal-content">
          {children}
        </div>
        
        {footer && (
          <div className="custom-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CustomModal;

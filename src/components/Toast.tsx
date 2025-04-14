import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ isClosing: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 15px 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  animation: ${props => props.isClosing ? slideOut : slideIn} 0.3s ease-in-out;
  z-index: 1000;
`;

interface ToastProps {
  message: string;
  onClose: () => void;
  isClosing: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, isClosing }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4700); // Um pouco menos que 5 segundos para permitir a animação de saída

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <ToastContainer isClosing={isClosing}>
      {message}
    </ToastContainer>
  );
};

export default Toast; 
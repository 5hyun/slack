import React, { FC, useCallback } from 'react';
import { CloseModalButton, CreateModal } from './styles';

interface Props {
  show: boolean;
  // () => void는 return 값이 없다. undefined 같이 쓰인다.
  onCloseModal: () => void;
  children: any;
}

const Modal: FC<Props> = ({ show, children, onCloseModal }) => {
  const stopPropagation = useCallback((e: any) => {
    e.stopPropagation();
  }, []);

  if (!show) {
    return null;
  }
  return (
    <CreateModal onClick={onCloseModal}>
      <div onClick={stopPropagation}>
        <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>
        {children}
      </div>
    </CreateModal>
  );
};

export default Modal;

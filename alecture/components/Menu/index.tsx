import React, { CSSProperties, FC, PropsWithChildren, useCallback } from 'react';
import { CloseModalButton, CreateMenu } from './styles';

// ts할때는 props에 대한 타입들을 적어줘야한다.
interface Props {
  show: boolean;
  onCloseModal: (e: any) => void;
  style: CSSProperties;
  closeButton?: boolean;
  children: any;
}

const Menu: FC<Props> = ({ children, style, show, onCloseModal, closeButton }) => {
  // 메뉴를 클릭하면 안닫히는데 자기 자신을 제외한 부모 태그를 클릭하면 닫힌다.
  const stopPropagation = useCallback((e: any) => {
    e.stopPropagation();
  }, []);

  if (!show) return null;

  return (
    // 메뉴를 클릭하면 CreateMenu까지 전달이 돼서 onCloseModal이 같이 실행된다.
    // 따라서 나를 클릭했는데 닫히면 안되니까 stopPropagation을 하면된다.
    <CreateMenu onClick={onCloseModal}>
      <div style={style} onClick={stopPropagation}>
        {closeButton && <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>}
        {children}
      </div>
    </CreateMenu>
  );
};

Menu.defaultProps = {
  closeButton: true,
};

export default Menu;

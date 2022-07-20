import Workspace from '@layouts/Workspace';
import React from 'react';

const Channel = () => {
  return (
    <Workspace>
      {/* div 태그가 Workspace의 children이 된다. 즉 다른 컴포넌트 안에 넣은 jsx는 childre이 된다. */}
      <div>로그인하신 것을 축하드려요!</div>
    </Workspace>
  );
};

export default Channel;

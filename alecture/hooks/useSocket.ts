import io from 'socket.io-client';
import { useCallback } from 'react';

const backurl = 'http://localhost:3095';

//여러 workspace에 들어가는 경우이다. ts에서는 빈 객체, 빈 배열에선 타입핑을 해야한다. key는 워크스페이스이다.
const sockets: { [key: string]: SocketIOClient.Socket } = {};
const useSocket = (workspace?: string): [SocketIOClient.Socket | undefined, () => void] => {
  const disconnect = useCallback(() => {
    if (workspace) {
      sockets[workspace].disconnect();
      //연결 끊었는데 계속 관리 할 필요 없어서 삭제
      delete sockets[workspace];
    }
  }, [workspace]);
  if (!workspace) {
    return [undefined, disconnect];
  }
  //기존에 없었으면 만든다.
  if (!sockets[workspace]) {
    sockets[workspace] = io.connect(`${backurl}/ws-${workspace}`, {
      //http맣고 웹소켓만 쓰라는 의미
      transports: ['websocket'],
    });
  }

  return [sockets[workspace], disconnect];
};

export default useSocket;

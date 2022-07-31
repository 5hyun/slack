import React, { memo, useMemo, VFC } from 'react';
import { IChat, IDM } from '@typings/db';
import { ChatWrapper } from '@components/Chat/styles';
import gravatar from 'gravatar';
import dayjs from 'dayjs';
import regexifyString from 'regexify-string';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router';

interface Props {
  data: IDM | IChat;
}
const Chat: VFC<Props> = ({ data }) => {
  const { workspace } = useParams<{ workspace: string; channel: string }>();
  //    dm에서는 채팅 받는 사람이다
  //  이렇게 하면 dm인지 channel인지 안다, 타입 가드 역할
  const user = 'Sender' in data ? data.Sender : data.User;

  const result = useMemo(
    () =>
      regexifyString({
        input: data.content,
        // g는 모두 선택한다는 의미
        //  // 안에 쓴다. 그리고 .은 모든 글, +는 한 개 이상, 숫자는 \d, ?는 0개나 1개, *은 0개 이상
        //  만약 @[제로초]12](7)일 때, +만 하면 제로초]12로 최대한 많이 찾고, +? 하면 제로초로 최대한 적게 찾는다.
        //  |는 또는, /n은 줄바꿈 의미
        pattern: /@\[(.+?)]\((\d+?)\)|\n/g,
        decorator(match, index) {
          const arr: string[] | null = match.match(/@\[(.+?)]\((\d+?)\)/)!;
          if (arr) {
            return (
              <Link key={match + index} to={`/workspace/${workspace}/dm/${arr[2]}`}>
                @{arr[1]}
              </Link>
            );
          }
          return <br key={index} />;
        },
      }),
    [workspace, data.content],
  );

  return (
    <ChatWrapper>
      <div className="chat-img">
        <img src={gravatar.url(user.email, { s: '36px', d: 'retro' })} alt={user.nickname} />
      </div>
      <div className="chat-text">
        <div className="chat-user">
          <b>{user.nickname}</b>
          <span>{dayjs(data.createdAt).format('h:mm A')}</span>
        </div>
        <p>{result}</p>
      </div>
    </ChatWrapper>
  );
};

export default memo(Chat);

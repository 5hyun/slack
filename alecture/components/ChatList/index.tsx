import React, { useCallback, useRef, VFC, forwardRef, MutableRefObject } from 'react';
import { ChatZone, Section, StickyHeader } from '@components/ChatList/styles';
import { IChat, IDM } from '@typings/db';
import Chat from '@components/Chat';
import Scrollbars from 'react-custom-scrollbars';

interface Props {
  chatSections: { [key: string]: (IDM | IChat)[] };
  setSize: (f: (size: number) => number) => Promise<IDM[][] | undefined>;
  isReachingEnd: boolean;
}

const ChatList = forwardRef<Scrollbars, Props>(({ chatSections, setSize, isReachingEnd }, scrollRef) => {
  const onScroll = useCallback(
    (values: any) => {
      if (values.scrollTop === 0 && !isReachingEnd) {
        console.log('가장 위');
        // 가장 위로 올라가면 페이지를 하나 더 불러온다.
        setSize((prevSize) => prevSize + 1).then(() => {
          //  스크롤 위치 유지
          const current = (scrollRef as MutableRefObject<Scrollbars>)?.current;
          //현재 스크롤Height - 스크롤Height를 빼주면 현재 스크롤 바 위치를 알 수 있다.
          if (current) {
            current.scrollTop(current?.getScrollHeight() - values.scrollHeight);
          }
        });
      }
      //    데이터 추가 로딩
    },
    [scrollRef, isReachingEnd, setSize],
  );

  return (
    <ChatZone>
      {/*autoHide는 가만히 있으면 스크롤이 사라진다.*/}
      <Scrollbars autoHide ref={scrollRef} onScrollFrame={onScroll}>
        {/*이렇게하면 객체가 배열로 바뀐다.*/}
        {Object.entries(chatSections).map(([date, chats]) => {
          return (
            <Section className={`section-${date}`} key={date}>
              <StickyHeader>
                <button>{date}</button>
              </StickyHeader>
              {chats.map((chat) => (
                <Chat key={chat.id} data={chat} />
              ))}
            </Section>
          );
        })}
      </Scrollbars>
    </ChatZone>
  );
});

export default ChatList;

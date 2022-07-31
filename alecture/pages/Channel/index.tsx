import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Container, DragOver, Header } from '@pages/Channel/styles';
import useInput from '@hooks/useInput';
import ChatList from '@components/ChatList';
import ChatBox from '@components/ChatBox';
import useSWR from 'swr';
import fetcher from '@utils/fetcher';
import useSWRInfinite from 'swr/infinite';
import { IChannel, IChat, IUser } from '@typings/db';
import useSocket from '@hooks/useSocket';
import axios from 'axios';
import makeSection from '@utils/makeSection';
import { useParams } from 'react-router';
import Scrollbars from 'react-custom-scrollbars';
import InviteChannelModal from '@components/InviteChannelModal';
import { ToastContainer } from 'react-toastify';

const Channel = () => {
  const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
  const { data: myData } = useSWR('/api/users', fetcher);
  const [chat, onChangeChat, setChat] = useInput('');
  const { data: channelData } = useSWR<IChannel>(`/api/workspaces/${workspace}/channels/${channel}`, fetcher);
  // useSWRInfinite를 하면 이중 배열을 사용한다.
  const {
    data: chatData,
    mutate: mutateChat,
    setSize,
  } = useSWRInfinite<IChat[]>(
    (index: number) => `/api/workspaces/${workspace}/channels/${channel}/chats?perPage=20&page=${index + 1}`,
    fetcher,
  );
  const { data: channelMembersData } = useSWR<IUser[]>(
    myData ? `/api/workspaces/${workspace}/channels/${channel}/members` : null,
    fetcher,
  );

  const [socket] = useSocket(workspace);
  // 아래 2개는 인피니티 스크롤링할 때 해주면 좋다
  //  데이터가 비어있으면 끝이다.
  const isEmpty = chatData?.[0]?.length === 0;
  // 데이터가 45개 있는데 20개씩 가져오니까 20 20 5 이렇게 가져온다.
  //  근데 20개 미만이면 더 가져올 데이터가 없으니 isReachingEnd를 flase로 만들어준다.
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < 20) || false;

  const scrollbarRef = useRef<Scrollbars>(null);
  const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const onSubmitForm = useCallback(
    (e: any) => {
      e.preventDefault();
      if (chat?.trim() && chatData && channelData) {
        const savedChat = chat;
        //  채팅 치면 아래로 내려 가는데 딜레이가 있어서 직관적인 UI로 해야한다.
        //  따라서 서버에 가기 전에 성공한 것 처럼 해줘야한다. 서버에 등록은 안했지만 등록된 것 처럼 해준다.
        //  직관적인 UI의 mutate의 shouldRevalidate를 false로 해야된다.
        mutateChat((prevChatData) => {
          prevChatData?.[0].unshift({
            id: (chatData[0][0]?.id || 0) + 1,
            content: savedChat,
            UserId: myData.id,
            User: myData,
            ChannelId: channelData.id,
            Channel: channelData,
            createdAt: new Date(),
          });
          return prevChatData;
        }, false).then(() => {
          setChat('');
          //채팅 치면 아래로 내려감
          scrollbarRef.current?.scrollToBottom();
        });
        axios
          .post(`/api/workspaces/${workspace}/channels/${channel}/chats`, {
            content: chat,
          })
          .then(() => {
            mutateChat();
            setChat('');
          })
          .catch(console.error);
      }
    },
    [chat, chatData, myData, channelData, workspace, channel],
  );

  const onMessage = useCallback(
    (data: IChat) => {
      // id는 상대방 아이디
      // 내 아이디까지 포함하면 mutate가 2번 된다.
      if (data.Channel.name === channel && (data.content.startsWith('uploads\\') || data.UserId !== myData?.id)) {
        mutateChat((chatData) => {
          chatData?.[0].unshift(data);
          return chatData;
        }, false).then(() => {
          //남이 채팅쳤을 때 내가 채팅을 150px 이상 올렸으면 안내려가고 150px 미만으로 올렸으면 아래로 내려간다.
          if (scrollbarRef.current) {
            if (
              scrollbarRef.current.getScrollHeight() <
              scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
            ) {
              console.log('scrollToBottom!', scrollbarRef.current?.getValues());
              //시간 차이 잡아주는거
              setTimeout(() => {
                scrollbarRef.current?.scrollToBottom();
              }, 50);
            }
          }
        });
      }
    },
    [channel, myData],
  );

  useEffect(() => {
    socket?.on('message', onMessage);
    return () => {
      socket?.off('message', onMessage);
    };
  }, [socket, onMessage]);

  //로딩 시 스크롤바 제일 아래로
  useEffect(() => {
    if (chatData?.length === 1) {
      scrollbarRef.current?.scrollToBottom();
    }
  }, [chatData]);

  const onClickInviteChannel = useCallback(() => {
    setShowInviteChannelModal(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setShowInviteChannelModal(false);
  }, []);

  useEffect(() => {
    //각 채널에 들어갔을 때 시간을 기록해서 안읽은 메시지 수를 구한다.
    localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
  }, [workspace, channel]);

  const onDrop = useCallback(
    (e: any) => {
      e.preventDefault();
      console.log(e);
      const formData = new FormData();
      if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            console.log(e, '.... file[' + i + '].name = ' + file.name);
            formData.append('image', file);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          console.log(e, '... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
          formData.append('image', e.dataTransfer.files[i]);
        }
      }
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
        setDragOver(false);
      });
    },
    [workspace, channel],
  );

  const onDragOver = useCallback((e: any) => {
    e.preventDefault();
    console.log(e);
    setDragOver(true);
  }, []);

  if (!myData || !myData) {
    return null;
  }

  // [...chatData]를 하면 새로운 배열로 정렬을 하는거라 chatData에 영향을 안준다.
  //  flat()는 2차원 배열을 1차원 배열로 바꿔준다.
  const chatSections = makeSection(chatData ? chatData.flat().reverse() : []);

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <span>#{channel}</span>
        <div className="header-right">
          <span>{channelMembersData?.length}</span>
          <button
            onClick={onClickInviteChannel}
            className="c-button-unstyled p-ia__view_header__button"
            aria-label="Add people to #react-native"
            data-sk="tooltip_parent"
            type="button"
          >
            <i className="c-icon p-ia__view_header__button_icon c-icon--add-user" aria-hidden="true" />
          </button>
        </div>
      </Header>
      {/* 대부분 swr을 쓰면되지만 ChatList는 2개 이상의 컴포넌트에서 사용할거라 props를 준다. */}
      <ChatList chatSections={chatSections} ref={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd} />
      <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
      <InviteChannelModal
        show={showInviteChannelModal}
        onCloseModal={onCloseModal}
        setShowInviteChannelModal={setShowInviteChannelModal}
      />
      <ToastContainer position="bottom-center" />
      {dragOver && <DragOver>업로드!</DragOver>}
    </Container>
  );
};

export default Channel;

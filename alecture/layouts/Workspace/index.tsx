import axios from 'axios';
import React, { useCallback, useState, VFC} from 'react';
import {Redirect, Route, Switch, useParams} from 'react-router';
import useSWR from 'swr';
import {
  AddButton,
  Channels,
  Chats,
  Header,
  LogOutButton,
  MenuScroll,
  ProfileImg,
  ProfileModal,
  RightMenu,
  WorkspaceButton, WorkspaceModal,
  WorkspaceName,
  Workspaces,
  WorkspaceWrapper,
} from '@layouts/Workspace/styles';
import gravatar from 'gravatar';
import loadable from '@loadable/component';
import Menu from '@components/Menu';
import { Link } from 'react-router-dom';
import { IUser } from '@typings/db';
import { Button, Input, Label } from '@pages/SignUp/styles';
import useInput from '@hooks/useInput';
import Modal from '@components/Modal';
import { toast } from 'react-toastify';
import fetcher from "@utils/fetcher";
import CreateChannelModal from "@components/CreateChannelModal";
import {IChannel} from "@typings/db";

const Channel = loadable(() => import('@pages/Channel'));
const DirectMessage = loadable(() => import('@pages/DirectMessage'));

const Workspace: VFC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const[showWorkspaceModal,setShowWorkspaceModal] = useState(false);
  const[showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newWorkspace, onChangeNewWorkspace, setNewWorkspace] = useInput('');
  const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');

  const {workspace} = useParams<{workspace: string}>();
  const {
    data: userData,
    error,
    mutate,
  } = useSWR<IUser | false>('/api/users', fetcher, {
    dedupingInterval: 2000,
  });

  const {data: channelData} = useSWR<IChannel[]>(
      // 내가 로그인 한 상태에 채널을 가져온다.
      userData ? `/api/workspaces/${workspace}/channels` : null,
      fetcher
  );

  const onLogout = useCallback(() => {
    axios
      .post('http://localhost:3095/api/users/logout', null, {
        // 이걸해야 백과 프론트 쿠키 공유 가능
        withCredentials: true,
      })
      .then(() => {
        // 로그아웃이 성공하면 data엔 내 정보가 있다가 false로 바뀜
        mutate(false, false);
      });
  }, []);

  const onCloseUserProfile = useCallback((e: any) => {
    e.stopPropagation();
    setShowUserMenu(false);
  }, []);

  // 메뉴를 클릭하면 나왔다 안나왔다 해주는 토글 함수
  const onClickUserProfile = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const onClickCreateWorkspace = useCallback(() => {
    setShowCreateWorkspaceModal(true);
  }, []);

  const onCreateWorkspace = useCallback(
    (e: any) => {
      e.prevenDefault();
      // 다 채워져 있는지 검사한다. 그리고 trim()을 넣어야 띄어쓰기만 있는 것을 통과시켜주지 않는다.]
      if (!newWorkspace || !newWorkspace.trim()) return;
      if (!newUrl || !newUrl.trim()) return;
      axios
        .post(
            'http://localhost:3095/api/workspaces',
            {
              workspace: newWorkspace,
              url: newUrl,
            },
            {
              withCredentials: true,
            },
        )
        .then(() => {
          // 성공하고나서 이런거 안비어두면 이전 입력값이 남아있다.
          mutate();
          setShowCreateWorkspaceModal(false);
          setNewWorkspace('');
          setNewUrl('');
          console.log("성공");
        })
        .catch((error) => {
          // 에러 파악하기 위한 콘솔
          console.dir(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
          console.log("실패");
        })
          .finally(()=>{
            console.log("되긴하니?");
          });
    },
    [newWorkspace, newUrl],
  );

  const onCloseModal = useCallback(() => {
    setShowCreateWorkspaceModal(false);
    setShowCreateChannelModal(false);
  }, []);

  const toggleWorkspaceModel = useCallback(()=>{
    setShowWorkspaceModal((prev)=>!prev);
  },[]);

  const onClickAddChannel = useCallback(()=>{
    setShowCreateChannelModal(true);
  },[]);

  //   로그아웃 버튼을 누르면 data가 false가 되어 login 페이지로 간다.
  if (!userData) {
    return <Redirect to="/login" />;
  }

  return (
    <div>
      <Header>
        <RightMenu>
          <span onClick={onClickUserProfile}>
            <ProfileImg src={gravatar.url(userData.email, { s: '28px', d: 'retro' })} alt={userData.email} />
            {showUserMenu && (
              <Menu style={{ right: 0, top: 38 }} show={showUserMenu} onCloseModal={onCloseUserProfile}>
                <ProfileModal>
                  <img src={gravatar.url(userData.email, { s: '28px', d: 'retro' })} alt={userData.email} />
                  <div>
                    <span id="profile-name">{userData.email}</span>
                    <span id="profile-active">Active</span>
                  </div>
                </ProfileModal>
                <LogOutButton onClick={onLogout}>로그아웃</LogOutButton>
              </Menu>
            )}
          </span>
        </RightMenu>
      </Header>
      <WorkspaceWrapper>
        <Workspaces>
          {userData?.Workspaces?.map((ws) => {
            return (
              <Link key={ws.id} to={`/workspace/${ws.url}/channel/일반`}>
                <WorkspaceButton>{ws.name.slice(0, 1).toUpperCase()}</WorkspaceButton>
              </Link>
            );
          })}
          <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
        </Workspaces>
        <Channels>
          <WorkspaceName onClick={toggleWorkspaceModel}>Sleact</WorkspaceName>
          <MenuScroll>
            <Menu show={showWorkspaceModal} onCloseModal={toggleWorkspaceModel} style={{top: 94, left:80}}>
              <WorkspaceModal>
                <h2>Sleact</h2>
                {/*<button onClick={onClickInvitWorkspace}>워크스페이스에 사용자 초대</button>*/}
                <button onClick={onClickAddChannel}>채널 만들기</button>
                <button onClick={onLogout}>로그아웃</button>
              </WorkspaceModal>
            </Menu>
            {channelData?.map((v)=>(
                <div>{v.name}</div>
            ))}
          </MenuScroll>
        </Channels>
        <Chats>
          <Switch>
            <Route path="/workspace/:workspace/channel/:channel" component={Channel} />
            <Route path="/workspace/:workspace/dm/:id" component={DirectMessage} />
          </Switch>
        </Chats>
      </WorkspaceWrapper>
      <Modal show={showCreateWorkspaceModal} onCloseModal={onCloseModal}>
        <form onSubmit={onCreateWorkspace}>
          <Label id="workspace-label">
            <span>워크스페이스 이름</span>
            <Input id="workspace" value={newWorkspace} onChange={onChangeNewWorkspace} />
          </Label>
          <Label id="workspace-url-label">
            <span>워크스페이스 url</span>
            <Input id="workspace" value={newUrl} onChange={onChangeNewUrl} />
          </Label>
          <Button type="submit">생성하기</Button>
        </form>
      </Modal>
      <CreateChannelModal show={showCreateChannelModal} onCloseModal={onCloseModal}
                          setShowCreateChannelModal={setShowCreateChannelModal}/>
    </div>
  );
};

export default Workspace;

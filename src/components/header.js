import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

import { theme, Link, Button, LeftFrame, RightFrame, ThreadAction, ThreadName, ThreadRenameInput } from '../theme'
import logo from '../logo_white.png';
import imgRename from '../rename.png';
import imgAccept from '../accept.png';

const HeaderWrapper = styled.div`
  background-color: ${theme.annaGray};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-left: 1rem;

  :hover {
    cursor: pointer;
  }

  #link {
    text-decoration-color: ${theme.UniswapPink};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${theme.wisteriaPurple};
    :hover {
      color: ${darken(0.1, theme.wisteriaPurple)};
    }
  }
`

const Location = styled.div`
  display: flex;
  align-items: center;
`

const Title = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem;

  :hover {
    cursor: pointer;
  }

  #link {
    text-decoration-color: ${theme.UniswapPink};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${theme.wisteriaPurple};
    :hover {
      color: ${darken(0.1, theme.wisteriaPurple)};
    }
  }
`

const StatusGeneric = styled.button`
  width: 100%;
  font-size: 0.9rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 2rem;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const StatusConnect = styled(StatusGeneric)`
  background-color: transparent;
  border: 1px solid ${theme.royalBlue};
  color: ${theme.royalBlue};
  font-weight: 500;

  :hover,
  :focus {
    border: 1px solid ${darken(0.1, theme.royalBlue)};
    color: ${darken(0.1, theme.royalBlue)};
  }

  :active {
    background-color: ${darken(0.1, theme.backgroundColor)};
  }
`

const LogoFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const LogoElement = styled.div`
  margin-right: 0.4rem;
  display: flex;
  min-width: 0;
  align-items: center;
`

const Status = styled.div`
  display: flex;
  align-items: center;
`

const StatusElement = styled.div`
  margin: 0.5rem 0.5rem 0.5rem 0;
`

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      app: props.app,
    }
  }

  componentDidMount() {
    this.state.app.setState({headerObj: this})
  }

  render() {
    if (!this.state.app.state.headerObj) {
      // Not ready to render
      return null;
    }

    let onInputPressEnter = (e) => {
      if (e.keyCode === 13 && e.shiftKey === false) {
        e.preventDefault();
        this.state.app.renameThread(e);
      }
    }

    const app = this.state.app
    const channelId = app.state.currentChannelId
    const threadId = app.state.currentThreadId
    const channelName = (channelId !== null) ? (
      app.channelsMap.get(channelId).channel_name
    ) : (
      "All messages"
    )
    const threadName = (threadId !== null) ? (
      (app.threadsMap.get(threadId)) ? (
        app.threadsMap.get(threadId).name
      ) : (
        "Unnamed Thread"
      )
    ) : (null)
    const isShowRename = threadId !== null && !app.state.renamingThread;
    const isShowAccept = threadId !== null && app.state.renamingThread;
    return (
      <HeaderWrapper>
        <LeftFrame>
          <Logo>
            <Link id="link" href="https://nearprotocol.com">
              <LogoFrame>
                <LogoElement>
                  <img src={logo} width="22" height="22" alt="logo"/>
                </LogoElement>
                <LogoElement>
                  <h1 id="title">NEAR Chat!</h1>
                </LogoElement>
              </LogoFrame>
            </Link>
          </Logo>
        </LeftFrame>
        <RightFrame>
          <Location>
            <Title>
              {channelName}
            </Title>
            {isShowAccept ? (
              <ThreadRenameInput id="thread_rename_input" onKeyDown={(e) => onInputPressEnter(e)}/>
            ) : (
              <ThreadName>{threadName}</ThreadName>
            )}
            {isShowRename ? (
              <ThreadAction onClick={e => this.state.app.startRenaming(e)}><img src={imgRename} width="16" height="16" alt="rename"/></ThreadAction>
            ) : (null)}
            {isShowAccept ? (
              <ThreadAction onClick={e => this.state.app.renameThread(e)}><img src={imgAccept} width="16" height="16" alt="rename"/></ThreadAction>
            ) : (null)}
          </Location>
          {app.state.connected ? (
            <Status>
              {app.state.signedIn && app.state.fullAccess ? (
                <Title>Full Access</Title>
              ) : (
                <Title>Limited Access</Title>
              )}
              {app.unauthorizedDeviceKey ? (
                <StatusElement>
                  <Button onClick={() => app.authorizeDeviceKey()}>Auth Device</Button>
                </StatusElement>
              ) : (null)}
              {app.state.signedIn ? (
                <StatusElement>
                  <StatusConnect onClick={() => app.requestSignOut()}>Sign Out</StatusConnect>
                </StatusElement>
              ) : (
                <StatusElement>
                  <Button onClick={() => app.requestSignIn()}>Log In</Button>
                </StatusElement>
              )}
            </Status>
          ) : (
            <Status>
              <Title>No Access</Title>
              <StatusElement>
                <StatusConnect onClick={() => window.location.reload()}>Connecting...</StatusConnect>
              </StatusElement>
            </Status>
          )}
        </RightFrame>
      </HeaderWrapper>
    )
  }
}

export default Header;
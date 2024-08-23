import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  incChatMessageCount,
  resetChatMessageCount,
} from '../actions/remoteAccess';
import { fetchChatMessages, sendChatMessage } from '../api/remoteAccess';
import {
  addResponseMessage,
  addUserMessage,
  setBadgeCount,
  Widget,
} from 'react-chat-widget';
import Draggable from 'react-draggable';
import { store } from '../store';

function ChatWidget() {
  const dispatch = useDispatch();

  const username = useSelector((state) => state.login.user.username);
  const observers = useSelector((state) => state.remoteAccess.observers);
  const chatMessageCount = useSelector(
    (state) => state.remoteAccess.chatMessageCount,
  );

  useEffect(() => {
    const { user } = store.getState().login; // non-reactive so effect runs only on mount

    (async function loadMessages() {
      const { messages } = await fetchChatMessages();
      let unread = 0;

      messages.forEach((entry) => {
        unread += entry.read ? 0 : 1;

        if (entry.username === user.username) {
          addUserMessage(`${entry.date} **You:** \n\n ${entry.message} \n\n`);
        } else {
          addResponseMessage(
            `${entry.date} **${entry.nickname}:** \n\n ${entry.message}`,
          );
        }
      });

      setBadgeCount(unread);
      dispatch(incChatMessageCount(unread));
    })();
  }, [dispatch]);

  useEffect(() => {
    setBadgeCount(chatMessageCount);
  }, [chatMessageCount]);

  if (observers.length === 0) {
    return null;
  }

  return (
    <div className="chat-widget-dragable">
      <Draggable>
        <div onClick={() => dispatch(resetChatMessageCount())}>
          <Widget
            title="Chat"
            subtitle=""
            handleNewUserMessage={(message) => {
              sendChatMessage(message, username);
            }}
          />
        </div>
      </Draggable>
    </div>
  );
}

export default ChatWidget;

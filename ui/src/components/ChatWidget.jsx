import { useCallback, useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDispatch, useSelector } from 'react-redux';

import {
  incChatMessageCount,
  resetChatMessageCount,
} from '../actions/remoteAccess';
import { fetchChatMessages, sendChatMessage } from '../api/remoteAccess';
import { store } from '../store';
import styles from './ChatWidget.module.css';

let externalAddResponseMessage = null;

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function addResponseMessage(text) {
  externalAddResponseMessage?.current?.(text);
}

function ChatWidget() {
  const dispatch = useDispatch();

  const username = useSelector((state) => state.login.user.username);
  const observers = useSelector((state) => state.remoteAccess.observers);
  const chatMessageCount = useSelector(
    (state) => state.remoteAccess.chatMessageCount,
  );

  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef();
  const messagesContainerRef = useRef(null);
  const addResponseRef = useRef(null);

  if (!externalAddResponseMessage) {
    externalAddResponseMessage = addResponseRef;
  }

  const addResponse = useCallback((text) => {
    const newMessage = {
      id: `r-${Date.now()}-${Math.random()}`,
      type: 'response',
      text,
      date: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  addResponseRef.current = addResponse;

  const addUser = useCallback((text) => {
    const newMessage = {
      id: `u-${Date.now()}-${Math.random()}`,
      type: 'user',
      text,
      date: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    const { user } = store.getState().login;

    (async function loadMessages() {
      const { messages: fetchedMessages } = await fetchChatMessages();
      const built = fetchedMessages.map((entry) => {
        const isSelf = entry.username === user.username;
        return {
          id:
            entry.id || `${isSelf ? 'u' : 'r'}-${Date.now()}-${Math.random()}`,
          type: isSelf ? 'user' : 'response',
          text: isSelf
            ? `${entry.date} **You:** \n\n ${entry.message} \n\n`
            : `${entry.date} **${entry.nickname}:** \n\n ${entry.message}`,
          date: entry.date || new Date().toISOString(),
        };
      });

      const unread = fetchedMessages.reduce(
        (acc, e) => acc + (e.read ? 0 : 1),
        0,
      );

      setMessages(built);
      dispatch(incChatMessageCount(unread));
    })();
  }, [dispatch]);

  const setMessagesRef = useCallback(() => {
    if (isOpen && messagesContainerRef.current) {
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  }, [isOpen]);

  setMessagesRef();

  function toggleOpen() {
    setIsOpen((prev) => {
      if (!prev) {
        dispatch(resetChatMessageCount());
        return true;
      }
      return false;
    });
  }

  function submit() {
    const v =
      inputRef.current && inputRef.current.value
        ? inputRef.current.value.trim()
        : '';
    if (!v) {
      return;
    }
    sendChatMessage(v, username);
    addUser(v);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  if (observers.length === 0) {
    return null;
  }

  return (
    <div className={styles.chatWidgetDragable}>
      <Draggable>
        <div onClick={() => isOpen && dispatch(resetChatMessageCount())}>
          <div
            className={`${styles.widgetContainer} ${
              isOpen ? styles.widgetContainerOpen : styles.widgetContainerClosed
            } ${isOpen ? '' : styles.hidden}`}
            aria-hidden={!isOpen}
          >
            <div className={styles.conversationContainer}>
              <div className={styles.header}>
                <div className={styles.title}>Chat</div>
              </div>

              <div
                className={styles.messagesContainer}
                ref={messagesContainerRef}
                role="log"
                aria-live="polite"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.message} ${
                      m.type === 'user'
                        ? `${styles.messageClient} ${styles.client}`
                        : styles.response
                    }`}
                  >
                    <div className={styles.messageText}>
                      <div dangerouslySetInnerHTML={{ __html: m.text }} />
                    </div>
                    <div className={styles.timestamp}>{formatTime(m.date)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.sender}>
                <textarea
                  ref={inputRef}
                  className={styles.newMessage}
                  placeholder="Type a message..."
                  rows={2}
                  aria-label="Type a message"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`${styles.send} btn btn-primary`}
                  onClick={submit}
                  aria-label="Send"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.launcher}
            aria-label="Toggle chat"
            onClick={toggleOpen}
          >
            <div className={styles.launcherIcon}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  fill="currentColor"
                />
              </svg>
            </div>
            {!isOpen && chatMessageCount > 0 ? (
              <div className={styles.badge}>{chatMessageCount}</div>
            ) : null}
          </button>
        </div>
      </Draggable>
    </div>
  );
}

export default ChatWidget;

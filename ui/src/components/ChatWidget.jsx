import { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDispatch, useSelector } from 'react-redux';

import {
  incChatMessageCount,
  resetChatMessageCount,
} from '../actions/remoteAccess';
import { fetchChatMessages, sendChatMessage } from '../api/remoteAccess';
import { store } from '../store';
import styles from './ChatWidget.module.css';

const _messages = [];
let _badgeCount = 0;
let _isOpen = false;
const _subs = new Set();

function notify() {
  for (const s of _subs) {
    try {
      s({ messages: [..._messages], badge: _badgeCount });
    } catch {
      // ignore
    }
  }
}

function addResponseMessage(text) {
  _messages.push({
    id: `r-${Date.now()}-${Math.random()}`,
    type: 'response',
    text,
    date: new Date().toISOString(),
  });
  if (!_isOpen) {
    _badgeCount += 1;
  }
  notify();
}

function addUserMessage(text) {
  _messages.push({
    id: `u-${Date.now()}-${Math.random()}`,
    type: 'user',
    text,
    date: new Date().toISOString(),
  });
  notify();
}

function setBadgeCount(count) {
  _badgeCount = Number(count) || 0;
  notify();
}

// Export for external use (e.g., serverIO.js)
export { addResponseMessage };

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

function ChatWidget() {
  const dispatch = useDispatch();

  const username = useSelector((state) => state.login.user.username);
  const observers = useSelector((state) => state.remoteAccess.observers);
  const chatMessageCount = useSelector(
    (state) => state.remoteAccess.chatMessageCount,
  );

  const [state, setState] = useState({
    messages: [..._messages],
    badge: _badgeCount,
    open: false,
  });
  const inputRef = useRef();
  const messagesRef = useRef();

  // Subscribe to internal message state
  useEffect(() => {
    function sub(s) {
      setState((prev) => ({ ...prev, messages: s.messages, badge: s.badge }));
    }
    _subs.add(sub);
    sub({ messages: [..._messages], badge: _badgeCount });
    return () => _subs.delete(sub);
  }, []);

  // Load messages from API on mount
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

  // Sync chatMessageCount from Redux
  useEffect(() => {
    setBadgeCount(chatMessageCount);
  }, [chatMessageCount]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (state.open) {
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [state.messages, state.open]);

  function toggleOpen() {
    setState((prev) => {
      if (!prev.open) {
        dispatch(resetChatMessageCount());
        _badgeCount = 0;
        _isOpen = true;
        return { ...prev, open: true, badge: 0 };
      }
      _isOpen = false;
      return { ...prev, open: false };
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
    addUserMessage(v);
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
        <div onClick={() => state.open && dispatch(resetChatMessageCount())}>
          <div
            className={`${styles.widgetContainer} ${
              state.open ? '' : styles.hidden
            }`}
            style={{
              display: state.open ? 'flex' : 'none',
              width: 360,
              right: 20,
              bottom: state.open ? 90 : 20,
            }}
            aria-hidden={!state.open}
          >
            <div className={styles.conversationContainer}>
              <div className={styles.header} style={{ position: 'relative' }}>
                <div className={styles.title}>Chat</div>
              </div>

              <div
                className={styles.messagesContainer}
                ref={messagesRef}
                role="log"
                aria-live="polite"
              >
                {state.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.message} ${
                      m.type === 'user'
                        ? `${styles.messageClient} ${styles.client}`
                        : styles.response
                    }`}
                  >
                    <div
                      className={styles.messageText}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
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
            style={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              cursor: 'pointer',
              zIndex: 2001,
            }}
            aria-label="Toggle chat"
            onClick={toggleOpen}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: '#35cce6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 10px 1px rgba(0,0,0,0.15)',
              }}
            >
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
            {!state.open && state.badge > 0 ? (
              <div
                className={styles.badge}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: 'red',
                  color: 'white',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {state.badge}
              </div>
            ) : null}
          </button>
        </div>
      </Draggable>
    </div>
  );
}

export default ChatWidget;

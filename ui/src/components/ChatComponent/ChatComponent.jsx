import { useLayoutEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDispatch, useSelector } from 'react-redux';

import {
  markAllAsRead,
  sendChatMessage as sendChatMessageAction,
} from '../../actions/remoteAccess';
import styles from './ChatComponent.module.css';
import { selectUnreadChatMessageCount } from './selector';

function formatTime(iso) {
  try {
    if (!iso) {
      return '';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
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
  const messages = useSelector((state) => state.remoteAccess.messages);
  const observers = useSelector((state) => state.remoteAccess.observers);
  const chatMessageCount = useSelector(selectUnreadChatMessageCount);

  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  const messagesContainerRef = useRef(null);

  // Scroll to bottom when messages change
  useLayoutEffect(() => {
    if (!isOpen || !messagesContainerRef.current) {
      return;
    }
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [isOpen, messages.length]);

  function toggleOpen() {
    setIsOpen((prev) => {
      if (prev) {
        dispatch(markAllAsRead());
      }
      return !prev;
    });
  }

  function submit() {
    const trimmed = messageText.trim();
    if (!trimmed) {
      return;
    }
    dispatch(sendChatMessageAction(trimmed, username));
    setMessageText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  if (observers.length === 0) {
    return null;
  }

  return (
    <div className={styles.chatWidgetDragable}>
      <Draggable>
        <div>
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
                      <div>
                        <div>
                          <strong>{m.name}</strong>
                          <span> : </span>
                        </div>
                        <div>
                          {(() => {
                            const raw = String(m.message || '');
                            const lines = raw
                              .split('\n')
                              .map((l) =>
                                l.endsWith('\r') ? l.slice(0, -1) : l,
                              );
                            return lines.map((line, idx) => (
                              <span key={`${m.id}-${line}`}>
                                {line}
                                {idx < lines.length - 1 ? <br /> : null}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className={styles.timestamp}>{formatTime(m.date)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.sender}>
                <textarea
                  className={styles.newMessage}
                  placeholder="Type a message..."
                  rows={2}
                  aria-label="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
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
            <div
              className={`${styles.launcherIcon} ${
                isOpen ? styles.launcherIconOpen : ''
              }`}
              aria-hidden="true"
            />
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

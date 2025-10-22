import { useCallback, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDispatch, useSelector } from 'react-redux';

import {
  markAllAsRead,
  sendChatMessage as sendChatMessageAction,
} from '../../actions/remoteAccess';
import styles from './ChatWidget.module.css';

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
  const observers = useSelector((state) => state.remoteAccess.observers);
  const chatMessageCount = useSelector(
    (state) => state.remoteAccess.chatMessageCount,
  );
  const messages = useSelector((state) => state.remoteAccess.messages);

  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef();
  const messagesContainerRef = useRef(null);

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
      if (prev) {
        dispatch(markAllAsRead());
      }
      return !prev;
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
    dispatch(sendChatMessageAction(v, username));
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
            <div className={styles.launcherIcon} aria-hidden="true" />
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

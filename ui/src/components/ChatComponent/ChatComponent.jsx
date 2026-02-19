import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { useDispatch, useSelector } from 'react-redux';

import {
  markAllAsRead,
  sendChatMessage as sendChatMessageAction,
} from '../../actions/remoteAccess';
import styles from './ChatComponent.module.css';

function ChatWidget() {
  const dispatch = useDispatch();

  const username = useSelector((state) => state.login.user.username);
  const messages = useSelector((state) => state.remoteAccess.messages);
  const observers = useSelector((state) => state.remoteAccess.observers);
  const chatMessageCount = useSelector(
    (state) =>
      state.remoteAccess.messages.filter(
        (msg) => msg.type === 'response' && !msg.read,
      ).length,
  );

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
    if (isOpen) {
      dispatch(markAllAsRead());
    }
    setIsOpen(!isOpen);
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
            className={styles.widgetContainer}
            data-open={isOpen || undefined}
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
                        <div>{m.message}</div>
                      </div>
                    </div>
                    <div className={styles.timestamp}>
                      {new Date(m.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>{' '}
              <div className={styles.sender}>
                <Form.Control
                  as="textarea"
                  className={styles.newMessage}
                  placeholder="Type a message..."
                  rows={2}
                  aria-label="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  variant="primary"
                  className={styles.send}
                  onClick={submit}
                >
                  Send
                </Button>
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
              <i
                className={`fas ${isOpen ? 'fa-times' : 'fa-comments'}`}
                aria-hidden="true"
              />
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

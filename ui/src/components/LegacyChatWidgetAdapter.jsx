import { useEffect, useRef, useState } from 'react';

import { resetChatMessageCount } from '../actions/remoteAccess';
import { store } from '../store';

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

export function addResponseMessage(text) {
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

export function addUserMessage(text) {
  _messages.push({
    id: `u-${Date.now()}-${Math.random()}`,
    type: 'user',
    text,
    date: new Date().toISOString(),
  });
  notify();
}

export function setBadgeCount(count) {
  _badgeCount = Number(count) || 0;
  notify();
}

export function isChatOpen() {
  return _isOpen;
}

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

export function Widget({
  title = 'Chat',
  subtitle = '',
  handleNewUserMessage,
  _launcherLabel = '',
  _autofocus = false,
}) {
  const [state, setState] = useState({
    messages: [..._messages],
    badge: _badgeCount,
    open: false,
  });
  const inputRef = useRef();
  const messagesRef = useRef();

  useEffect(() => {
    function sub(s) {
      setState((prev) => ({ ...prev, messages: s.messages, badge: s.badge }));
    }
    _subs.add(sub);
    sub({ messages: [..._messages], badge: _badgeCount });
    return () => _subs.delete(sub);
  }, []);

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
        try {
          store.dispatch(resetChatMessageCount());
        } catch {
          // ignore
        }
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
    if (typeof handleNewUserMessage === 'function') {
      handleNewUserMessage(v);
    }
    addUserMessage(v);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <>
      <div
        className={`rcw-widget-container ${state.open ? '' : 'rcw-hidden'}`}
        style={{
          display: state.open ? 'flex' : 'none',
          width: 360,
          right: 20,
          bottom: state.open ? 90 : 20,
        }}
        aria-hidden={!state.open}
      >
        <div className="rcw-conversation-container">
          <div className="rcw-header" style={{ position: 'relative' }}>
            <div className="rcw-title">{title}</div>
            {subtitle ? <div className="rcw-subtitle">{subtitle}</div> : null}
          </div>

          <div
            className="rcw-messages-container"
            ref={messagesRef}
            role="log"
            aria-live="polite"
          >
            {state.messages.map((m) => (
              <div
                key={m.id}
                className={`rcw-message ${
                  m.type === 'user'
                    ? 'rcw-message-client rcw-client'
                    : 'rcw-response'
                }`}
              >
                <div
                  className="rcw-message-text"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  <div dangerouslySetInnerHTML={{ __html: m.text }} />
                </div>
                <div className="rcw-timestamp">{formatTime(m.date)}</div>
              </div>
            ))}
          </div>

          <div className="rcw-sender">
            <textarea
              ref={inputRef}
              className="rcw-new-message"
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
              className="rcw-send btn btn-primary"
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
        className="rcw-launcher"
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
            className="rcw-badge"
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
    </>
  );
}

/**
 * Simulates a second, independently logged-in mxcubeweb client "talking"
 * directly to the backend (outside the browser Cypress drives), so
 * remoteAccess e2e specs can exercise real two-user flows: observer join,
 * request/give control, chat messages, without two browser sessions sharing
 * the same cookie jar.
 */
import { connect } from 'socket.io-client';

// Set from cypress.config.js's `baseUrl` via `setBaseUrl`
let BASE_URL = null;

let cookie = null;
let socket = null;
let events = [];

// Browserless Node's fetch has no cookie jar, so the signed Flask
// session cookie (auth, sid, ...) must be captured here and added manually
// to every later call.
function storeCookies(res) {
  const setCookie = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : res.headers.raw?.()['set-cookie'] || [];
  if (setCookie.length > 0) {
    cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  }
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  if (!BASE_URL) {
    throw new Error(
      "secondUser BASE_URL is not set — cypress.config.js must call 'setBaseUrl' before this task runs",
    );
  }

  const res = await fetch(`${BASE_URL}/mxcube/api/v0.1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  storeCookies(res);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const secondUserTasks = {
  setBaseUrl(baseUrl) {
    BASE_URL = baseUrl;
    return null;
  },

  async 'secondUser:login'({ proposal = 'idtest0', password = '0000' } = {}) {
    return apiRequest('/login/', {
      method: 'POST',
      body: { proposal, password },
    });
  },

  async 'secondUser:setNickname'(name) {
    return apiRequest('/ra/update_user_nickname', {
      method: 'POST',
      body: { name },
    });
  },

  // Register wildcard socket events listener
  async 'secondUser:connectSocket'() {
    events = [];
    socket = connect(`${BASE_URL}/hwr`, {
      extraHeaders: cookie ? { Cookie: cookie } : {},
      transports: ['polling', 'websocket'],
      forceNew: true,
    });

    socket.onAny((name, data) => {
      events.push({ name, data });
    });

    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });

    return null;
  },

  'secondUser:getEvents'() {
    const current = events;
    events = [];
    return current;
  },

  async 'secondUser:requestControl'(message = 'Please give me control') {
    return apiRequest('/ra/request_control', {
      method: 'POST',
      body: { message },
    });
  },

  async 'secondUser:sendChatMessage'(message) {
    return apiRequest('/ra/chat', {
      method: 'POST',
      body: { message, username: 'secondUser' },
    });
  },

  async 'secondUser:getLoginInfo'() {
    return apiRequest('/login/login_info');
  },

  async 'secondUser:disconnect'() {
    socket?.disconnect();
    socket = null;

    const cookieAtDisconnect = cookie;
    cookie = null;
    events = [];

    if (cookieAtDisconnect) {
      await fetch(`${BASE_URL}/mxcube/api/v0.1/login/signout`, {
        headers: { Cookie: cookieAtDisconnect },
      });
    }

    return null;
  },
};

export default secondUserTasks;

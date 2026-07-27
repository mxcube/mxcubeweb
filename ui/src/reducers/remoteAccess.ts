/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { processChatMessageRecord } from '../components/ChatComponent/chatMessages';
import { type LoggedInSliceState, type User } from './login';

// This is the shape of the object recieved from the backend via `ra_chat_message` signal
export interface MessageEntry {
  message: string;
  username: string;
  nickname: string;
  host: string;
  date: string;
  read?: boolean | undefined;
  id?: string | undefined;
}

export interface Message {
  date: string;
  id: string;
  isSelf?: boolean;
  message: string;
  name?: string;
  type: 'user' | 'response';
  read?: boolean;
}

interface RemoteAccessState {
  allowRemote: boolean;
  messages: Message[];
  observers: User[];
  operator: User | undefined;
}

const initialState: RemoteAccessState = {
  allowRemote: false,
  messages: [],
  observers: [],
  operator: undefined,
};

// this action is fired after first login so we can use norrow type for login
interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: {
    remoteAccess: Omit<RemoteAccessState, 'messages'>;
    // absent when the initial fetchChatMessages() request failed (see actions/login.js's notify())
    chatMessages?: {
      messages: MessageEntry[];
    };
    login: LoggedInSliceState;
  };
}

const remoteAccessSlice = createSlice({
  initialState,
  name: 'remoteAccess',
  reducers: {
    setRemoteAccessState(
      state,
      action: PayloadAction<Omit<RemoteAccessState, 'messages'>>,
    ) {
      state.operator = action.payload.operator;
      state.observers = action.payload.observers;
      state.allowRemote = action.payload.allowRemote;
    },
    setAllowRemote(state, action: PayloadAction<boolean>) {
      state.allowRemote = action.payload;
    },
    addChatMessage(state, action: PayloadAction<Message>) {
      state.messages.push({
        date: action.payload.date,
        id: action.payload.id,
        isSelf: action.payload.isSelf ?? false,
        message: action.payload.message,
        name: action.payload.name ?? '',
        type: action.payload.type,
        read: action.payload.read ?? false,
      });
    },
    markAllMessagesRead(state) {
      state.messages.forEach((msg) => {
        msg.read = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      'SET_INITIAL_STATE',
      (_state, action: SetInitialStateAction) => {
        const { username } = action.data.login.user;
        const messages = username
          ? (action.data.chatMessages?.messages ?? []).map((record) =>
              processChatMessageRecord(record, username),
            )
          : [];
        const { allowRemote, observers, operator } = action.data.remoteAccess;
        return { allowRemote, messages, observers, operator };
      },
    );
  },
});

export const {
  setRemoteAccessState,
  setAllowRemote,
  addChatMessage,
  markAllMessagesRead,
} = remoteAccessSlice.actions;

export default remoteAccessSlice.reducer;

import { omit } from 'lodash/object';
import shortid from 'shortid';

const initialState = {
  loading: false,
  showErrorPanel: false,
  errorMessage: '',
  dialogMessage: '',
  dialogTitle: '',
  showDialog: false,
  userMessages: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      {
        return { ...state,
                 loading: action.loading,
                 title: action.title,
                 message: action.message,
                 blocking: action.blocking,
                 abortFun: action.abortFun
               };
      }
    case 'SHOW_ERROR_PANEL':
      {
        return { ...state, showErrorPanel: action.show, errorMessage: action.message };
      }
    case 'SHOW_DIALOG':
      {
        return {
          ...state,
          showDialog: action.show,
          dialogTitle: action.title,
          dialogMessage: action.message
        };
      }
    case 'ADD_USER_MESSAGE':
      {
        const userMessages = [];
        let id = shortid.generate();

        while (state.userMessages[id]) {
          id = shortid.generate();
        }

        for (const message of state.userMessages) {
          if (message.exp >= new Date().getTime()) {
            userMessages.push(message);
          }
        }

        userMessages.push({ ...action.message, id });
        return { ...state, userMessages };
      }
    case 'REMOVE_USER_MESSAGE':
      {
        let userMessages = state.userMessages;

        if (userMessages[action.messageID]) {
          userMessages = omit(userMessages, action.messageID);
        }

        return { ...state, userMessages };
      }
    case 'CLEAR_ALL_USER_MESSAGES':
      {
        return { ...state, userMessages: {} };
      }

    default:
      return state;
  }
};

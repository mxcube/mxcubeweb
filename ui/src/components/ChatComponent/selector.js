export function selectUnreadChatMessageCount(state) {
  return state.remoteAccess.messages.filter(
    (msg) => msg.type === 'response' && !msg.read,
  ).length;
}

export function selectChatMessages(state) {
  return state.remoteAccess.messages;
}

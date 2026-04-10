// ── Client → Server ──────────
export const CLIENT_EVENTS = {
  JOIN_CONVERSATION:  'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  TYPING_START:'typing_start',
  TYPING_STOP:'typing_stop',
  MESSAGE_SEEN:'message_seen',
} as const;

// ── Server → Client ───
export const SERVER_EVENTS = {
  RECEIVE_MESSAGE:'receive_message',
  MESSAGE_EDITED:'message_edited',
  MESSAGE_DELETED:'message_deleted',
  MESSAGE_DELIVERED:'message_delivered',
  MESSAGES_SEEN:'messages_seen',
  USER_TYPING:'user_typing',
  USER_STOP_TYPING:'user_stop_typing',
  ONLINE_USERS:'online_users',
  CONVERSATION_DELETED: 'conversation_deleted',
  
  // Friend request events
  FRIEND_REQUEST:'friend_request',          // new request received
  FRIEND_REQUEST_UPDATED: 'friend_request_updated',  // accepted or declined
  CONVERSATION_CREATED:   'conversation_created',    // new conv created after accept
} as const;

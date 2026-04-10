import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import FriendRequest from '../models/FriendRequest';
import { CLIENT_EVENTS, SERVER_EVENTS } from './events';

const onlineUsers = new Map<string, string>(); // userId → socketId

const getUserId = (socket: Socket): string | undefined =>
  (socket as Socket & { userId?: string }).userId;

export const initSocket = (io: Server): void => {

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      (socket as Socket & { userId: string }).userId = user._id.toString();
      next();
    } catch { next(); }
  });

  io.on('connection', async (socket) => {
    const userId = getUserId(socket);

    if (userId) {
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit(SERVER_EVENTS.ONLINE_USERS, Array.from(onlineUsers.keys()));

      // Join personal room for direct notifications (friend requests etc.)
      socket.join(`user:${userId}`);

      // Auto-join all conversation rooms
      try {
        const convs = await Conversation.find({ participants: userId }).select('_id');
        convs.forEach((c) => socket.join(c._id.toString()));
      } catch (err) { console.error('[socket:autoJoin]', err); }

      // Mark sent messages as delivered
      await markMessagesDelivered(userId, io);

      // Send pending friend requests to the user on connect
      try {
        const pending = await FriendRequest.find({ to: userId, status: 'pending' })
          .populate('from', '_id username email isOnline');
        if (pending.length > 0) {
          socket.emit('pending_requests', pending);
        }
      } catch (err) { console.error('[socket:pendingRequests]', err); }
    }

    socket.emit(SERVER_EVENTS.ONLINE_USERS, Array.from(onlineUsers.keys()));

    socket.on(CLIENT_EVENTS.JOIN_CONVERSATION, (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on(CLIENT_EVENTS.LEAVE_CONVERSATION, (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on(CLIENT_EVENTS.TYPING_START, (data: { conversationId: string; username: string }) => {
      socket.to(data.conversationId).emit(SERVER_EVENTS.USER_TYPING, {
        conversationId: data.conversationId,
        username: data.username,
        userId,
      });
    });

    socket.on(CLIENT_EVENTS.TYPING_STOP, (data: { conversationId: string }) => {
      socket.to(data.conversationId).emit(SERVER_EVENTS.USER_STOP_TYPING, {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on(CLIENT_EVENTS.MESSAGE_SEEN, async (data: { conversationId: string; viewerId: string }) => {
      try {
        await Message.updateMany(
          { conversationId: data.conversationId, sender: { $ne: data.viewerId }, status: { $ne: 'seen' } },
          { status: 'seen', read: true }
        );
        io.to(data.conversationId).emit(SERVER_EVENTS.MESSAGES_SEEN, {
          conversationId: data.conversationId,
          seenBy: data.viewerId,
        });
      } catch (err) { console.error('[socket:message_seen]', err); }
    });

    socket.on('disconnect', async () => {
      if (userId) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit(SERVER_EVENTS.ONLINE_USERS, Array.from(onlineUsers.keys()));
      }
    });
  });
};

async function markMessagesDelivered(userId: string, io: Server) {
  try {
    const convs = await Conversation.find({ participants: userId }).select('_id');
    const convIds = convs.map((c) => c._id.toString());
    const result = await Message.updateMany(
      { conversationId: { $in: convIds }, sender: { $ne: userId }, status: 'sent' },
      { status: 'delivered' }
    );
    if (result.modifiedCount > 0) {
      convIds.forEach((cid) => {
        io.to(cid).emit(SERVER_EVENTS.MESSAGE_DELIVERED, { conversationId: cid, deliveredTo: userId });
      });
    }
  } catch (err) { console.error('[socket:markDelivered]', err); }
}

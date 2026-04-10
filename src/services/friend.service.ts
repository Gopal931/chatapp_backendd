import { Types } from 'mongoose';
import FriendRequest from '../models/FriendRequest';
import User from '../models/User';
import Conversation from '../models/Conversation';

// Search user by email (for People tab)
export const searchUserByEmail = async (email: string, currentUserId: Types.ObjectId) => {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    _id: { $ne: currentUserId },
  }).select('_id username email isOnline lastSeen');
  return user;
};

// Send a friend/chat request
export const sendFriendRequest = async (fromId: Types.ObjectId, toId: string) => {
  // Check not sending to self
  if (fromId.toString() === toId) throw new Error('INVALID');

  // Check if conversation already exists
  const existing = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [fromId, toId], $size: 2 },
  });
  if (existing) throw new Error('ALREADY_CONNECTED');

  // Check if request already sent
  const alreadySent = await FriendRequest.findOne({ from: fromId, to: toId });
  if (alreadySent) throw new Error('ALREADY_SENT');

  const request = await FriendRequest.create({ from: fromId, to: toId });
  await request.populate([
    { path: 'from', select: '_id username email' },
    { path: 'to',   select: '_id username email' },
  ]);
  return request;
};

// Get all pending requests received by a user
export const getPendingRequests = async (userId: Types.ObjectId) => {
  return FriendRequest.find({ to: userId, status: 'pending' })
    .populate('from', '_id username email isOnline')
    .sort({ createdAt: -1 });
};

// Get sent requests by a user (so UI can show "Request Sent")
export const getSentRequests = async (userId: Types.ObjectId) => {
  return FriendRequest.find({ from: userId, status: 'pending' })
    .populate('to', '_id username email')
    .sort({ createdAt: -1 });
};

// Accept a request → creates conversation
export const acceptFriendRequest = async (requestId: string | string[], userId: Types.ObjectId) => {
  const request = await FriendRequest.findOne({ _id: requestId, to: userId, status: 'pending' });
  if (!request) throw new Error('NOT_FOUND');

  request.status = 'accepted';
  await request.save();

  // Create the conversation between the two users
  let conv = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [request.from, request.to], $size: 2 },
  });

  if (!conv) {
    conv = await Conversation.create({
      isGroup: false,
      participants: [request.from, request.to],
    });
  }

  await conv.populate('participants', '_id username email isOnline lastSeen');
  await request.populate([
    { path: 'from', select: '_id username email' },
    { path: 'to',   select: '_id username email' },
  ]);

  return { request, conversation: conv };
};

// Decline a request
export const declineFriendRequest = async (requestId: string | string[], userId: Types.ObjectId) => {
  const request = await FriendRequest.findOne({ _id: requestId, to: userId, status: 'pending' });
  if (!request) throw new Error('NOT_FOUND');

  request.status = 'declined';
  await request.save();
  return request;
};

// Get users who are already connected (accepted conversation) — for group creation
type PopulatedUser = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: Date;
};

export const getConnectedUsers = async (userId: Types.ObjectId) => {
  const convs = await Conversation.find({
    isGroup: false,
    participants: userId,
  }).populate<{ participants: PopulatedUser[] }>(
    'participants',
    '_id username email isOnline lastSeen'
  );

  return convs
    .map((c) => {
      return c.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
    })
    .filter(Boolean);
};
import { Types } from 'mongoose';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

const toPlain = (doc: unknown): Record<string, unknown> =>
  JSON.parse(JSON.stringify(doc));

const shapeConversation = (conv: Record<string, unknown>): Record<string, unknown> => {
  if (conv.lastMessage && typeof conv.lastMessage === 'object') {
    const lm = conv.lastMessage as Record<string, unknown>;
    lm.content = lm.text;
  }
  return conv;
};

export const getUserConversations = async (userId: Types.ObjectId) => {
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', '_id username email isOnline lastSeen')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: '_id username' } })
    .sort({ updatedAt: -1 });
  return conversations.map((c) => shapeConversation(toPlain(c)));
};

export const findOrCreateDirectConversation = async (userId: Types.ObjectId, participantId: string) => {
  if (!participantId) throw new Error('participantId is required');

  let conv = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [userId, participantId], $size: 2 },
  }).populate('participants', '_id username email isOnline');

  if (!conv) {
    conv = await Conversation.create({ isGroup: false, participants: [userId, participantId] });
    await conv.populate('participants', '_id username email isOnline');
  }
  return toPlain(conv);
};

export const createGroupConversation = async (
  creatorId: Types.ObjectId,
  groupName: string,
  participantIds: string[]
) => {
  if (!groupName?.trim())throw new Error('Group name is required');
  if (!participantIds || participantIds.length < 1) throw new Error('Add at least 1 member');

  const allParticipants = [creatorId.toString(), ...participantIds];
  const conv = await Conversation.create({
    isGroup: true,
    groupName: groupName.trim(),
    participants: allParticipants,
  });
  await conv.populate('participants', '_id username email isOnline');
  return toPlain(conv);
};

export const deleteConversationById = async (conversationId: string, userId: Types.ObjectId) => {
  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new Error('NOT_FOUND');
  await Message.deleteMany({ conversationId });
  await conv.deleteOne();
  return { conversationId };
};
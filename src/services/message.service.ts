import { Types } from 'mongoose';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { s3, ALLOWED_TYPES, MAX_SIZE } from '../middleware/upload';

const toPlain = (doc: unknown): Record<string, unknown> =>
  JSON.parse(JSON.stringify(doc));

export const shapeMessage = (m: Record<string, unknown>): Record<string, unknown> => ({
  ...m,
  conversationId: m.conversationId?.toString(),
  content: m.text,
});

// ── Presigned PUT URL generate karo — frontend seedha S3 mein upload karega ──
// 5 minute mein expire hoga
export const generateUploadUrl = async (
  fileKey:string,
  mimeType:string,
  fileSize:number,
  userId:Types.ObjectId
): Promise<string> => {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`File type not allowed: ${mimeType}`);
  }
  if (fileSize > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const command = new PutObjectCommand({
    Bucket:process.env.AWS_S3_BUCKET!,
    Key:fileKey,
    ContentType:mimeType,
    ContentLength: fileSize,
    // Metadata mein userId store karo for audit trail
    Metadata: { uploadedBy: userId.toString() },
  });

  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
};

// ── Presigned GET URL generate karo — receiver file download karega ──────────
export const generateDownloadUrl = async (
  fileKey: string,
  fileName: string
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket:process.env.AWS_S3_BUCKET!,
    Key:fileKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
};

// ── Get all messages + generate fresh download URLs ───────
export const getMessagesByConversation = async (
  conversationId: string,
  userId: Types.ObjectId
) => {
  if (!conversationId) throw new Error('conversationId is required');

  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new Error('FORBIDDEN');   

  const messages = await Message.find({ conversationId })
    .populate('sender', '_id username email')
    .sort({ createdAt: 1 });                 

  // Har file message ke liye fresh presigned GET URL generate karo
  const shaped = await Promise.all(
    messages.map(async (m) => {
      const plain = shapeMessage(toPlain(m));
      if (m.fileKey && m.fileName && (m.messageType === 'image' || m.messageType === 'file')) {
        plain.fileUrl = await generateDownloadUrl(m.fileKey, m.fileName);
      }
      return plain;
    })
  );
  
  return shaped;
};

// ── Text message save karo ─────
export const createMessage = async (
  conversationId: string,
  senderId: Types.ObjectId,
  text: string
) => {
  if (!conversationId) throw new Error('conversationId is required');
  if (!text?.trim())   throw new Error('Message cannot be empty');

  const conv = await Conversation.findOne({ _id: conversationId, participants: senderId });
  if (!conv) throw new Error('FORBIDDEN');

  const message = await Message.create({
    conversationId, sender: senderId,
    text: text.trim(), messageType: 'text', status: 'sent',
  });
  conv.lastMessage = message._id;
  await conv.save();

  const populated = await message.populate('sender', '_id username email');
  return shapeMessage(toPlain(populated));
};

// ── File message save karo (frontend ne already S3 mein upload kar diya) ─────
// Yahan sirf DB mein save hoga — file backend se nahi guzri
export const createFileMessage = async (
  conversationId: string,
  senderId:Types.ObjectId,
  fileKey:string,
  fileName:string,
  fileSize:number,
  fileMimeType:string,
) => {
  if (!conversationId) throw new Error('conversationId is required');
  if (!fileKey)throw new Error('fileKey is required');

  const conv = await Conversation.findOne({ _id: conversationId, participants: senderId });
  if (!conv) throw new Error('FORBIDDEN');

  const isImage= fileMimeType.startsWith('image/');
  const messageType = isImage ? 'image' : 'file';

  // DB mein sirf fileKey store karo — URL nahi
  const message = await Message.create({
    conversationId,
    sender:senderId,
    text:'',
    messageType,
    fileKey,      // ← sirf key, URL nahi
    fileName,
    fileSize,
    fileMimeType,
    status:'sent',
  });

  conv.lastMessage = message._id;
  await conv.save();

  const populated = await message.populate('sender', '_id username email');
  const plain= shapeMessage(toPlain(populated));

  // Response mein fresh download URL bhi bhejo
  plain.fileUrl = await generateDownloadUrl(fileKey, fileName);

  return plain;
};

// ── Single message ke liye fresh download URL generate karo ───
export const refreshFileUrl = async (messageId: string, userId: Types.ObjectId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error('NOT_FOUND');

  const conv = await Conversation.findOne({
    _id: message.conversationId,
    participants: userId,
  });
  if (!conv) throw new Error('FORBIDDEN');
  // fileKey nahi hai — purana message hai jo fileUrl se save hua tha
  if (!message.fileKey || !message.fileName) {
    throw new Error('NO_FILE_KEY');
  }

  const fileUrl = await generateDownloadUrl(message.fileKey, message.fileName);
  return { messageId, fileUrl };
};

// ── Edit message ──
export const updateMessageText = async (
  messageId: string,
  senderId:Types.ObjectId,
  newText:string
) => {
  if (!newText?.trim()) throw new Error('Message cannot be empty');
  const message = await Message.findById(messageId).populate('sender', '_id username email');
  if (!message) throw new Error('NOT_FOUND');
  if (message.sender._id.toString() !== senderId.toString()) throw new Error('FORBIDDEN');
  message.text   = newText.trim();
  message.edited = true;
  await message.save();
  return shapeMessage(toPlain(message));
};

// ── Delete message ────
export const removeMessage = async (messageId: string, senderId: Types.ObjectId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error('NOT_FOUND');
  if (message.sender.toString() !== senderId.toString()) throw new Error('FORBIDDEN');
  const conversationId = message.conversationId.toString();
  await message.deleteOne();
  const lastMsg = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: lastMsg?._id ?? null });
  return { messageId, conversationId };
};
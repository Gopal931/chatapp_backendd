import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import {
  getMessagesByConversation,
  createMessage,
  createFileMessage,
  generateUploadUrl,
  refreshFileUrl,
  updateMessageText,
  removeMessage,
} from '../services/message.service';

// GET /api/messages/:conversationId
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await getMessagesByConversation(
      req.params.conversationId as string,
      req.user!._id
    );
    res.json(messages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch messages';
    if (msg === 'FORBIDDEN') { res.status(403).json({ message: 'Not a participant' }); return; }
    res.status(500).json({ message: msg });
  }
};

// POST /api/messages — text message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const text = req.body.text || req.body.content;
    const response = await createMessage(req.body.conversationId, req.user!._id, text);
    const io: Server = req.app.get('io');
    if (io) io.to(req.body.conversationId).emit('receive_message', response);
    res.status(201).json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send message';
    if (msg === 'FORBIDDEN') { res.status(403).json({ message: 'Not a participant' }); return; }
    res.status(500).json({ message: msg });
  }
};

// GET /api/messages/upload-url — frontend presigned PUT URL maangta hai
// Step 1 of new upload flow:
//   Frontend → GET /upload-url?fileName=photo.jpg&fileType=image/jpeg&fileSize=148295
//   Backend  → presigned PUT URL return karta hai
//   Frontend → directly S3 mein PUT request karta hai (backend se file nahi guzrti)
export const getUploadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fileName, fileType, fileSize } = req.query as {
      fileName: string;
      fileType: string;
      fileSize: string;
    };

    if (!fileName || !fileType || !fileSize) {
      res.status(400).json({ message: 'fileName, fileType, fileSize required' });
      return;
    }

    const size = parseInt(fileSize, 10);

    // Unique S3 key generate karo
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey  = `pulse-chat/${Date.now()}-${safeName}`;

    const uploadUrl = await generateUploadUrl(fileKey, fileType, size, req.user!._id);

    // fileKey frontend ko do — wo message save karte waqt bhejega
    res.json({ uploadUrl, fileKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate upload URL';
    res.status(400).json({ message: msg });
  }
};

// POST /api/messages/file — file S3 mein upload ho gayi, ab message save karo
// Step 2 of new upload flow:
//   Frontend ne S3 mein file upload kar di
//   Ab sirf metadata (fileKey, fileName etc.) bhejta hai
//   Backend MongoDB mein save karta hai
export const sendFileMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, fileKey, fileName, fileSize, fileMimeType } = req.body;

    if (!conversationId || !fileKey || !fileName || !fileSize || !fileMimeType) {
      res.status(400).json({ message: 'conversationId, fileKey, fileName, fileSize, fileMimeType required' });
      return;
    }

    const response = await createFileMessage(
      conversationId,
      req.user!._id,
      fileKey,
      fileName,
      parseInt(fileSize, 10),
      fileMimeType,
    );

    const io: Server = req.app.get('io');
    if (io) io.to(conversationId).emit('receive_message', response);

    res.status(201).json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save file message';
    if (msg === 'FORBIDDEN') { res.status(403).json({ message: 'Not a participant' }); return; }
    res.status(500).json({ message: msg });
  }
};

// GET /api/messages/download-url/:messageId — fresh presigned GET URL maango
export const getDownloadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await refreshFileUrl(
      req.params.messageId as string,
      req.user!._id
    );
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate download URL';
    if (msg === 'NOT_FOUND')   { res.status(404).json({ message: 'Message not found' }); return; }
    if (msg === 'FORBIDDEN')   { res.status(403).json({ message: 'Not a participant' }); return; }
    if (msg === 'NO_FILE_KEY') { res.status(404).json({ message: 'No file key — old message' }); return; }
    res.status(500).json({ message: msg });
  }
};

// PUT /api/messages/:messageId
export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newText  = req.body.text || req.body.content;
    const response = await updateMessageText(req.params.messageId as string, req.user!._id, newText);
    const convId   = response.conversationId as string;
    const io: Server = req.app.get('io');
    if (io && convId) io.to(convId).emit('message_edited', response);
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to edit message';
    if (msg === 'NOT_FOUND') { res.status(404).json({ message: 'Message not found' }); return; }
    if (msg === 'FORBIDDEN') { res.status(403).json({ message: 'Not your message' }); return; }
    res.status(500).json({ message: msg });
  }
};

// DELETE /api/messages/:messageId
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await removeMessage(req.params.messageId as string, req.user!._id);
    const io: Server = req.app.get('io');
    if (io) io.to(result.conversationId).emit('message_deleted', result);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete message';
    if (msg === 'NOT_FOUND') { res.status(404).json({ message: 'Message not found' }); return; }
    if (msg === 'FORBIDDEN') { res.status(403).json({ message: 'Not your message' }); return; }
    res.status(500).json({ message: msg });
  }
};
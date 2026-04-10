/**
 * Conversation Controller
 * HTTP layer only — all logic is in conversation.service.ts
 */
import { Response } from 'express';
import { Server } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import {
  getUserConversations,
  findOrCreateDirectConversation,
  createGroupConversation,
  deleteConversationById,
} from '../services/conversation.service';

// GET /api/conversations
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await getUserConversations(req.user!._id);
    res.json(conversations);
  } catch {
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// POST /api/conversations
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isGroup, participantId, groupName, participantIds } = req.body;

    if (isGroup) {
      const conv = await createGroupConversation(req.user!._id, groupName, participantIds);
      res.status(201).json(conv);
    } else {
      const conv = await findOrCreateDirectConversation(req.user!._id, participantId);
      res.json(conv);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create conversation';
    res.status(400).json({ message });
  }
};

// DELETE /api/conversations/:conversationId
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await deleteConversationById(req.params.conversationId, req.user!._id);

    // Tell everyone in the room the conversation was deleted
    const io: Server = req.app.get('io');
    if (io) io.to(result.conversationId).emit('conversation_deleted', result);

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete conversation';
    if (message === 'NOT_FOUND') { res.status(404).json({ message: 'Conversation not found' }); return; }
    res.status(500).json({ message });
  }
};

import { Response } from 'express';
import { Server } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import { SERVER_EVENTS } from '../sockets/events';
import {
  searchUserByEmail, sendFriendRequest, getPendingRequests,
  getSentRequests, acceptFriendRequest, declineFriendRequest,
  getConnectedUsers,
} from '../services/friend.service';
import { Types } from 'mongoose';
// GET /api/friends/search?email=...
export const searchUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ message: 'Email is required' }); return;
    }
    const user = await searchUserByEmail(email, req.user!._id);
    if (!user) { res.status(404).json({ message: 'No user found with that email' }); return; }
    res.json(user);
  } catch { res.status(500).json({ message: 'Search failed' }); }
};

// POST /api/friends/request
export const sendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { toId } = req.body;
    if (!toId) { res.status(400).json({ message: 'toId is required' }); return; }

    const request = await sendFriendRequest(req.user!._id, toId);

    // Notify the receiver via socket in real-time
    const io: Server = req.app.get('io');
    if (io) {
      io.to(`user:${toId}`).emit(SERVER_EVENTS.FRIEND_REQUEST, request);
    }

    res.status(201).json(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    if (msg === 'ALREADY_SENT')      { res.status(400).json({ message: 'Request already sent' }); return; }
    if (msg === 'ALREADY_CONNECTED') { res.status(400).json({ message: 'Already connected' }); return; }
    if (msg === 'INVALID')           { res.status(400).json({ message: 'Invalid request' }); return; }
    res.status(500).json({ message: 'Failed to send request' });
  }
};

// GET /api/friends/requests/pending
export const getPending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await getPendingRequests(req.user!._id);
    res.json(requests);
  } catch { res.status(500).json({ message: 'Failed to fetch requests' }); }
};

// GET /api/friends/requests/sent
export const getSent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await getSentRequests(req.user!._id);
    res.json(requests);
  } catch { res.status(500).json({ message: 'Failed to fetch sent requests' }); }
};

// POST /api/friends/accept/:requestId
export const accept = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { request, conversation } = await acceptFriendRequest(req.params.requestId, req.user!._id);

    const io: Server = req.app.get('io');
    if (io) {
      const fromId = (request.from as { _id: Types.ObjectId })._id?.toString() ?? request.from.toString();
      // Tell the sender their request was accepted + new conversation
      io.to(`user:${fromId}`).emit(SERVER_EVENTS.FRIEND_REQUEST_UPDATED, {
        requestId: request._id,
        status: 'accepted',
        conversation,
      });
      // Tell both users to join the new conversation room
      io.to(`user:${fromId}`).socketsJoin(conversation._id.toString());
      io.to(`user:${req.user!._id.toString()}`).socketsJoin(conversation._id.toString());
      // Emit the new conversation to both
      io.to(`user:${fromId}`).emit(SERVER_EVENTS.CONVERSATION_CREATED, conversation);
      io.to(`user:${req.user!._id.toString()}`).emit(SERVER_EVENTS.CONVERSATION_CREATED, conversation);
    }

    res.json({ request, conversation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    if (msg === 'NOT_FOUND') { res.status(404).json({ message: 'Request not found' }); return; }
    res.status(500).json({ message: 'Failed to accept request' });
  }
};

// POST /api/friends/decline/:requestId
export const decline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await declineFriendRequest(req.params.requestId, req.user!._id);
    const io: Server = req.app.get('io');
    if (io) {
      const fromId = request.from.toString();
      io.to(`user:${fromId}`).emit(SERVER_EVENTS.FRIEND_REQUEST_UPDATED, {
        requestId: request._id,
        status: 'declined',
      });
    }
    res.json({ message: 'Request declined' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    if (msg === 'NOT_FOUND') { res.status(404).json({ message: 'Request not found' }); return; }
    res.status(500).json({ message: 'Failed to decline request' });
  }
};

// GET /api/friends/connected — users you can add to groups
export const getConnected = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await getConnectedUsers(req.user!._id);
    res.json(users);
  } catch { res.status(500).json({ message: 'Failed to fetch connected users' }); }
};

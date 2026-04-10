
//  User Controller

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAllUsersExcept } from '../services/user.service';

// GET /api/users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await getAllUsersExcept(req.user!._id);
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

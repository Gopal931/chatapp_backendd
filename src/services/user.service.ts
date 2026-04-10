/**
 * User Service
 * Business logic for user-related operations.
 */
import { Types } from 'mongoose';
import User from '../models/User';

// ── Get all users except the current one ────────
export const getAllUsersExcept = async (currentUserId: Types.ObjectId) => {
  return User.find({ _id: { $ne: currentUserId } })
    .select('_id username email isOnline lastSeen')
    .sort({ username: 1 });
};

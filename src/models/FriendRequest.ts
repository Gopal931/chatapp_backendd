import mongoose, { Document, Schema } from 'mongoose';

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface IFriendRequest extends Document {
  _id: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;   // who sent the request
  to:   mongoose.Types.ObjectId;   // who receives the request
  status: RequestStatus;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    from:{ type: Schema.Types.ObjectId, ref: 'User', required: true },
    to:{ type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
  },
  { timestamps: true }
);

// One request per pair at a time
FriendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);

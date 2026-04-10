import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  isGroup: boolean;
  groupName?: string;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
}

const ConversationSchema = new Schema<IConversation>(
  {
    isGroup:      { type: Boolean, default: false },
    groupName:    { type: String },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage:  { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', ConversationSchema);

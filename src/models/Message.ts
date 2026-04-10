import mongoose, { Document, Schema } from 'mongoose';

export type MessageStatus = 'sent' | 'delivered' | 'seen';
export type MessageType   = 'text' | 'file' | 'image';

export interface IMessage extends Document {
  _id:mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender:mongoose.Types.ObjectId;
  text:string;
  edited:boolean;
  read:boolean;
  status:MessageStatus;
  // File fields (only set when messageType = 'file' or 'image')
  messageType:MessageType;
  fileKey: string | null;
  fileName:string | null;   // original file name shown in UI
  fileSize:number | null;   // bytes — shown as "2.3 MB"
  fileMimeType:   string | null;   // "image/jpeg", "application/pdf" etc.
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender:{ type: Schema.Types.ObjectId, ref: 'User',required: true },
    text:{ type: String, default: '' },
    edited:{ type: Boolean, default: false },
    read:{ type: Boolean, default: false },
    status:{ type: String,  enum: ['sent','delivered','seen'], default: 'sent' },
    messageType:{ type: String,  enum: ['text','file','image'],     default: 'text' },
    fileKey: { type: String, default: null },   // S3 object key (used for delete / private access)
    fileName:{ type: String,  default: null },
    fileSize:{ type: Number,  default: null },
    fileMimeType:   { type: String,  default: null },
    
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
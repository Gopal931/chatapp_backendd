import { Router } from 'express';
import protect from '../middleware/auth';
import {
  getMessages,
  sendMessage,
  getUploadUrl,
  sendFileMessage,
  getDownloadUrl,
  editMessage,
  deleteMessage,
} from '../controllers/messageController';

const router = Router();
router.use(protect);

// ── Specific string routes PEHLE, param routes BAAD MEIN ────────────────────
router.get('/upload-url', getUploadUrl);    // presigned PUT URL maango
router.post('/file', sendFileMessage); // upload ke baad message save karo
router.get('/download-url/:messageId', getDownloadUrl);  // presigned GET URL maango
router.post('/', sendMessage);
router.get('/:conversationId', getMessages);
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;
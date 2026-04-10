import { Router } from 'express';
import protect from '../middleware/auth';
import { getConversations, createConversation, deleteConversation } from '../controllers/conversationController';

const router = Router();
router.use(protect);

router.get('/',getConversations);
router.post('/', createConversation);
router.delete('/:conversationId',   deleteConversation);

export default router;

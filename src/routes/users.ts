import { Router } from 'express';
import protect from '../middleware/auth';
import { getAllUsers } from '../controllers/userController';

const router = Router();
router.use(protect);
router.get('/', getAllUsers);

export default router;

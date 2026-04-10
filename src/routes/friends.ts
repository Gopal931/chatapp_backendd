import { Router } from 'express';
import protect from '../middleware/auth';
import {
  searchUser, sendRequest, getPending, getSent,
  accept, decline, getConnected,
} from '../controllers/friendController';

const router = Router();
router.use(protect);

router.get('/search',searchUser);
router.post('/request',sendRequest);
router.get('/requests/pending',getPending);
router.get('/requests/sent',getSent);
router.post('/accept/:requestId',  accept);
router.post('/decline/:requestId', decline);
router.get('/connected',getConnected);

export default router;

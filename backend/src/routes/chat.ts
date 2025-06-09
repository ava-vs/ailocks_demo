import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const chatController = new ChatController();

// All chat routes require authentication
router.use(authenticateToken);

// Chat management
router.get('/', chatController.getUserChats);
router.post('/', chatController.createChat);
router.get('/:chatId', chatController.getChatById);
router.put('/:chatId', chatController.updateChat);
router.delete('/:chatId', chatController.deleteChat);

// Chat messages
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/:chatId/messages', chatController.sendMessage);

// Chat participants
router.post('/:chatId/participants', chatController.addParticipant);
router.delete('/:chatId/participants/:userId', chatController.removeParticipant);

export { router as chatRoutes };
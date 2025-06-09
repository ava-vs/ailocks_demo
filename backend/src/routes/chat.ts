import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';
import { validateChat } from '../middleware/validation';

const router = Router();
const chatController = new ChatController();

// All chat routes require authentication
router.use(authenticateToken);

// Chat management routes
router.get('/', chatController.getUserChats);
router.post('/', validateChat, chatController.createChat);
router.get('/:chatId', chatController.getChatById);
router.put('/:chatId', validateChat, chatController.updateChat);
router.delete('/:chatId', chatController.deleteChat);

// Message routes
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/:chatId/messages', chatController.sendMessage);

// Participant routes
router.post('/:chatId/participants', chatController.addParticipant);
router.delete('/:chatId/participants/:userId', chatController.removeParticipant);

export { router as chatRoutes };
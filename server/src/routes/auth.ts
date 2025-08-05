import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  registerUser, 
  loginUser, 
  getCurrentUser 
} from '../controllers/authController';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

export default router;

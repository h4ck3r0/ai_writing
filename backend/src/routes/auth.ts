import express from 'express';
import { Request, Response } from 'express';
// Import controllers later
// import { register, login, logout } from '../controllers/auth';

const router = express.Router();

// Temporary placeholder routes
router.post('/register', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Registration endpoint not implemented' });
});

router.post('/login', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Login endpoint not implemented' });
});

router.post('/logout', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Logout endpoint not implemented' });
});

router.get('/me', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Get current user endpoint not implemented' });
});

export default router;
import express from 'express';
import { Request, Response } from 'express';
// Import controllers later
// import { saveContent, getContent, exportContent } from '../controllers/writing';

const router = express.Router();

// Temporary placeholder routes
router.post('/', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Save content endpoint not implemented' });
});

router.get('/:id', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Get content endpoint not implemented' });
});

router.put('/:id', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Update content endpoint not implemented' });
});

router.delete('/:id', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Delete content endpoint not implemented' });
});

router.post('/:id/export', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Export content endpoint not implemented' });
});

router.get('/user/:userId', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Get user content endpoint not implemented' });
});

export default router;
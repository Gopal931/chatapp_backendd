import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';


// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ message });
  }
};  

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    // 400 for missing fields, 401 for wrong credentials
    const status = message.includes('required') ? 400 : 401;
    res.status(status).json({ message });
  }
};
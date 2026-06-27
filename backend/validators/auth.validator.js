import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).trim(),
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

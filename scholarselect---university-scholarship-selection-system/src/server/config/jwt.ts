import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'scholarship_system_default_dev_secret_institutional_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'student';
  studentId?: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

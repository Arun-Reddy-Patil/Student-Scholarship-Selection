import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRepo, IUser } from '../models/User.js';
import { StudentRepo } from '../models/Student.js';
import { generateToken } from '../config/jwt.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Register new account
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'student', studentId, department, course, academicYear, gpa } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await UserRepo.findOne({ email: cleanEmail });
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    let finalStudentId = studentId ? studentId.toUpperCase().trim() : undefined;
    if (role === 'student' && !finalStudentId) {
      finalStudentId = `STU-2026-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (finalStudentId) {
      const existingStudent = await StudentRepo.findOne({ studentId: finalStudentId });
      if (existingStudent) {
        res.status(400).json({ success: false, message: `Student ID ${finalStudentId} is already registered.` });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserRepo.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'student',
      studentId: finalStudentId,
      department: department?.trim(),
    });

    // If student, create student profile document
    if (newUser.role === 'student') {
      await StudentRepo.create({
        studentId: finalStudentId || 'STU-NEW',
        name: newUser.name,
        email: newUser.email,
        department: department?.trim() || 'General Studies',
        course: course?.trim() || 'Undergraduate Degree',
        academicYear: academicYear || '1st Year',
        gpa: Number(gpa) || 3.5,
        userId: newUser._id,
      });
    }

    const token = generateToken({
      userId: newUser._id!,
      email: newUser.email,
      role: newUser.role,
      studentId: newUser.studentId,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId,
        department: newUser.department,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserRepo.findOne({ email: cleanEmail });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const token = generateToken({
      userId: user._id!,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      name: user.name,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await UserRepo.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }

    let studentProfile = null;
    if (user.studentId) {
      studentProfile = await StudentRepo.findOne({ studentId: user.studentId });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        studentProfile,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch user profile.' });
  }
});

// Demo accounts endpoint for quick testing
router.get('/demo-accounts', async (req: Request, res: Response) => {
  res.json({
    success: true,
    accounts: [
      {
        role: 'admin',
        name: 'Dr. Eleanor Vance (Dean of Student Aid)',
        email: 'admin@university.edu',
        password: 'Admin@123456',
        description: 'University Administrator with budget control and selection authorization',
      },
      {
        role: 'student',
        name: 'Arun Reddy',
        email: 'arun.student@university.edu',
        password: 'Student@123456',
        studentId: 'STU-2026-101',
        description: 'High priority student applicant ($6,500 requested, priority score 90)',
      },
      {
        role: 'student',
        name: 'Maya Lin',
        email: 'maya.lin@university.edu',
        password: 'Student@123456',
        studentId: 'STU-2026-102',
        description: 'Graduate student applicant ($8,000 requested, priority score 83)',
      },
      {
        role: 'student',
        name: 'Sophia Rodriguez',
        email: 'sophia.rodriguez@university.edu',
        password: 'Student@123456',
        studentId: 'STU-2026-104',
        description: 'Top-tier applicant ($7,500 requested, priority score 97)',
      },
    ],
  });
});

export default router;

import { Router, Response } from 'express';
import { StudentRepo, IStudent } from '../models/Student.js';
import { ApplicationRepo } from '../models/Application.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all students (Admin, with search, department filter, and sorting)
router.get('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, department, sort = 'name', order = 'asc' } = req.query;

    let students = await StudentRepo.find();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.course.toLowerCase().includes(q)
      );
    }

    if (department && typeof department === 'string' && department !== 'All') {
      students = students.filter((s) => s.department === department);
    }

    students.sort((a, b) => {
      let valA = (a as any)[sort as string] ?? '';
      let valB = (b as any)[sort as string] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (order === 'desc') {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch students.' });
  }
});

// GET single student
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await StudentRepo.findById(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    // Role check: Student can only view their own record
    if (req.user?.role !== 'admin' && req.user?.studentId !== student.studentId) {
      res.status(403).json({ success: false, message: 'Access denied to this student profile.' });
      return;
    }

    // Attach latest applications
    const applications = await ApplicationRepo.find({ studentId: student.studentId });

    res.json({
      success: true,
      student,
      applications,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch student profile.' });
  }
});

// POST create student
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, name, email, department, course, academicYear, gpa, phone, householdIncome, familyMembers } = req.body;

    if (!studentId || !name || !email || !department || !course || !academicYear || gpa === undefined) {
      res.status(400).json({
        success: false,
        message: 'Student ID, Name, Email, Department, Course, Academic Year, and GPA are required.',
      });
      return;
    }

    const cleanStudentId = studentId.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingId = await StudentRepo.findOne({ studentId: cleanStudentId });
    if (existingId) {
      res.status(400).json({ success: false, message: `Student ID ${cleanStudentId} already exists.` });
      return;
    }

    const existingEmail = await StudentRepo.findOne({ email: cleanEmail });
    if (existingEmail) {
      res.status(400).json({ success: false, message: `Email ${cleanEmail} is already registered.` });
      return;
    }

    const numGpa = Number(gpa);
    if (isNaN(numGpa) || numGpa < 0 || numGpa > 4.0) {
      res.status(400).json({ success: false, message: 'GPA must be a valid number between 0.0 and 4.0.' });
      return;
    }

    const newStudent = await StudentRepo.create({
      studentId: cleanStudentId,
      name: name.trim(),
      email: cleanEmail,
      department: department.trim(),
      course: course.trim(),
      academicYear: academicYear.trim(),
      gpa: numGpa,
      phone: phone?.trim(),
      householdIncome: householdIncome ? Number(householdIncome) : undefined,
      familyMembers: familyMembers ? Number(familyMembers) : 4,
    });

    res.status(201).json({
      success: true,
      message: 'Student record created successfully.',
      student: newStudent,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create student record.' });
  }
});

// PUT update student
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await StudentRepo.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    // Role check
    if (req.user?.role !== 'admin' && req.user?.studentId !== existing.studentId) {
      res.status(403).json({ success: false, message: 'You are not authorized to modify this record.' });
      return;
    }

    const { name, department, course, academicYear, gpa, phone, householdIncome, familyMembers } = req.body;

    const updates: Partial<IStudent> = {};
    if (name) updates.name = name.trim();
    if (department) updates.department = department.trim();
    if (course) updates.course = course.trim();
    if (academicYear) updates.academicYear = academicYear.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (householdIncome !== undefined) updates.householdIncome = Number(householdIncome);
    if (familyMembers !== undefined) updates.familyMembers = Number(familyMembers);

    if (gpa !== undefined) {
      const numGpa = Number(gpa);
      if (isNaN(numGpa) || numGpa < 0 || numGpa > 4.0) {
        res.status(400).json({ success: false, message: 'GPA must be between 0.0 and 4.0.' });
        return;
      }
      updates.gpa = numGpa;
    }

    const updated = await StudentRepo.findByIdAndUpdate(req.params.id, updates);

    // Also sync student name & department in applications if name/department changed
    if (updates.name || updates.department || updates.course) {
      const apps = await ApplicationRepo.find({ studentId: existing.studentId });
      for (const app of apps) {
        await ApplicationRepo.findByIdAndUpdate(app._id!, {
          studentName: updates.name || app.studentName,
          department: updates.department || app.department,
          course: updates.course || app.course,
        });
      }
    }

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      student: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update student record.' });
  }
});

// DELETE student
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await StudentRepo.findById(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    await StudentRepo.findByIdAndDelete(req.params.id);
    // Delete associated applications
    await ApplicationRepo.deleteMany({ studentId: student.studentId });

    res.json({
      success: true,
      message: `Student ${student.name} (${student.studentId}) and associated applications deleted successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete student record.' });
  }
});

export default router;

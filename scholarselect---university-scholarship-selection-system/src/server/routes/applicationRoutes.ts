import { Router, Response } from 'express';
import { ApplicationRepo, IApplication, ApplicationStatus } from '../models/Application.js';
import { StudentRepo } from '../models/Student.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to compute priority score
export function calculatePriorityScore(gpa: number, householdIncome?: number): {
  meritScore: number;
  needScore: number;
  priorityScore: number;
} {
  // Merit Score (0 - 50): based on GPA (max 4.0)
  // GPA 4.0 -> 50, GPA 3.0 -> 37.5, GPA 2.0 -> 25
  const normalizedGpa = Math.max(0, Math.min(4.0, gpa || 0));
  const meritScore = Math.round((normalizedGpa / 4.0) * 50 * 10) / 10;

  // Need Score (0 - 50): based on household income
  // Income <= $20,000 -> 50
  // Income $30,000 -> 44
  // Income $50,000 -> 30
  // Income $80,000 -> 15
  // Income >= $120,000 -> 5
  let needScore = 30; // default middle
  if (householdIncome !== undefined && !isNaN(householdIncome)) {
    if (householdIncome <= 20000) needScore = 50;
    else if (householdIncome <= 35000) needScore = 44;
    else if (householdIncome <= 50000) needScore = 36;
    else if (householdIncome <= 70000) needScore = 26;
    else if (householdIncome <= 90000) needScore = 18;
    else if (householdIncome <= 120000) needScore = 10;
    else needScore = 5;
  }

  const priorityScore = Math.min(100, Math.round((meritScore + needScore) * 10) / 10);
  return { meritScore, needScore, priorityScore };
}

// GET applications
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, department, search, cycleYear = '2025-2026' } = req.query;

    let apps: IApplication[] = [];

    if (req.user?.role === 'admin') {
      apps = await ApplicationRepo.find();
    } else {
      // Student only sees their applications
      apps = await ApplicationRepo.find({
        $or: [{ studentId: req.user?.studentId }, { email: req.user?.email }],
      });
    }

    if (cycleYear && typeof cycleYear === 'string' && cycleYear !== 'All') {
      apps = apps.filter((a) => a.cycleYear === cycleYear);
    }

    if (status && typeof status === 'string' && status !== 'All') {
      apps = apps.filter((a) => a.status === status);
    }

    if (department && typeof department === 'string' && department !== 'All') {
      apps = apps.filter((a) => a.department === department);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.studentName.toLowerCase().includes(q) ||
          a.studentId.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q)
      );
    }

    // Sort descending by priority score by default
    apps.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({
      success: true,
      count: apps.length,
      applications: apps,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch applications.' });
  }
});

// GET single application
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const app = await ApplicationRepo.findById(req.params.id);
    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    if (req.user?.role !== 'admin' && req.user?.studentId !== app.studentId && req.user?.email !== app.email) {
      res.status(403).json({ success: false, message: 'Access denied to this application.' });
      return;
    }

    res.json({
      success: true,
      application: app,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch application.' });
  }
});

// POST submit application
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      studentId,
      studentName,
      email,
      department,
      course,
      academicYear,
      cycleYear = '2025-2026',
      scholarshipAmount,
      reason,
      customPriorityScore,
    } = req.body;

    const targetStudentId = req.user?.role === 'admin' ? studentId : req.user?.studentId;

    if (!targetStudentId) {
      res.status(400).json({ success: false, message: 'Student ID is required.' });
      return;
    }

    // Check duplicate application in the same cycle
    const existing = await ApplicationRepo.findOne({
      studentId: targetStudentId,
      cycleYear,
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `An application for student ${targetStudentId} already exists in cycle ${cycleYear}. You can update the existing application instead.`,
      });
      return;
    }

    // Find student profile for GPA & data
    const student = await StudentRepo.findOne({ studentId: targetStudentId });

    const finalName = (student?.name || studentName || req.user?.name || 'Applicant').trim();
    const finalEmail = (student?.email || email || req.user?.email || '').toLowerCase().trim();
    const finalDept = (student?.department || department || 'General').trim();
    const finalCourse = (student?.course || course || 'Undergraduate').trim();
    const finalYear = (student?.academicYear || academicYear || 'Current Year').trim();
    const gpa = student?.gpa || 3.5;

    const reqCost = Number(scholarshipAmount);
    if (isNaN(reqCost) || reqCost <= 0) {
      res.status(400).json({ success: false, message: 'Requested scholarship amount must be greater than 0.' });
      return;
    }

    // Calculate score
    let calculated = calculatePriorityScore(gpa, student?.householdIncome);
    let finalPriorityScore = calculated.priorityScore;

    if (req.user?.role === 'admin' && customPriorityScore !== undefined) {
      finalPriorityScore = Math.max(0, Math.min(100, Number(customPriorityScore)));
    }

    const newApp = await ApplicationRepo.create({
      studentId: targetStudentId,
      studentName: finalName,
      email: finalEmail,
      department: finalDept,
      course: finalCourse,
      academicYear: finalYear,
      cycleYear,
      scholarshipAmount: reqCost,
      priorityScore: finalPriorityScore,
      gpa,
      financialNeedScore: calculated.needScore,
      meritScore: calculated.meritScore,
      reason: reason || 'Scholarship requested for tuition and academic support.',
      status: 'Submitted',
      awardedAmount: 0,
      submissionDate: new Date().toISOString(),
      userId: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship application submitted successfully.',
      application: newApp,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit application.' });
  }
});

// PUT update application
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const app = await ApplicationRepo.findById(req.params.id);
    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.studentId === app.studentId || req.user?.email === app.email;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: 'You are not authorized to update this application.' });
      return;
    }

    const updates: Partial<IApplication> = {};

    // Fields student can edit
    if (isOwner && !isAdmin) {
      if (['Approved', 'Rejected', 'Selected', 'Not Selected'].includes(app.status)) {
        res.status(400).json({
          success: false,
          message: `Cannot edit an application with decision status '${app.status}'.`,
        });
        return;
      }

      if (req.body.scholarshipAmount !== undefined) {
        const amt = Number(req.body.scholarshipAmount);
        if (amt <= 0) {
          res.status(400).json({ success: false, message: 'Requested amount must be greater than zero.' });
          return;
        }
        updates.scholarshipAmount = amt;
      }
      if (req.body.reason) updates.reason = req.body.reason.trim();
      if (req.body.status && ['Draft', 'Submitted'].includes(req.body.status)) {
        updates.status = req.body.status;
      }
    }

    // Fields admin can edit
    if (isAdmin) {
      if (req.body.scholarshipAmount !== undefined) {
        updates.scholarshipAmount = Number(req.body.scholarshipAmount);
      }
      if (req.body.priorityScore !== undefined) {
        updates.priorityScore = Math.max(0, Math.min(100, Number(req.body.priorityScore)));
      }
      if (req.body.status !== undefined) {
        updates.status = req.body.status as ApplicationStatus;
      }
      if (req.body.awardedAmount !== undefined) {
        updates.awardedAmount = Number(req.body.awardedAmount);
      }
      if (req.body.reason) updates.reason = req.body.reason.trim();
      if (req.body.reviewerNotes !== undefined) updates.reviewerNotes = req.body.reviewerNotes;
      if (req.body.decisionDate !== undefined) updates.decisionDate = req.body.decisionDate;
    }

    const updated = await ApplicationRepo.findByIdAndUpdate(req.params.id, updates);

    res.json({
      success: true,
      message: 'Application updated successfully.',
      application: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update application.' });
  }
});

// DELETE application
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const app = await ApplicationRepo.findById(req.params.id);
    if (!app) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.studentId === app.studentId || req.user?.email === app.email;

    if (!isAdmin && (!isOwner || app.status !== 'Draft')) {
      res.status(403).json({
        success: false,
        message: 'Only administrators or student draft creators can delete this application.',
      });
      return;
    }

    await ApplicationRepo.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Application deleted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete application.' });
  }
});

export default router;

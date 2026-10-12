import { Router, Response } from 'express';
import { StudentRepo } from '../models/Student.js';
import { ApplicationRepo } from '../models/Application.js';
import { BudgetRepo } from '../models/Budget.js';
import { AllocationRepo } from '../models/Allocation.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET dashboard statistics
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { academicYear = '2025-2026' } = req.query;

    const totalStudents = await StudentRepo.countDocuments();
    const allApps = await ApplicationRepo.find({ cycleYear: academicYear as string });
    const budgetDoc = await BudgetRepo.findOne({ academicYear: academicYear as string });

    const totalApplications = allApps.length;
    const selectedApps = allApps.filter((a) => a.status === 'Approved' || a.status === 'Selected');
    const unselectedApps = allApps.filter((a) => a.status === 'Not Selected' || a.status === 'Rejected');
    const underReviewApps = allApps.filter((a) => a.status === 'Under Review' || a.status === 'Submitted');

    const totalRequested = allApps.reduce((acc, a) => acc + (Number(a.scholarshipAmount) || 0), 0);
    const totalAllocated = selectedApps.reduce((acc, a) => acc + (Number(a.awardedAmount || a.scholarshipAmount) || 0), 0);

    const availableBudget = budgetDoc ? budgetDoc.totalBudget : 50000;
    const remainingBudget = Math.max(0, availableBudget - totalAllocated);
    const budgetUtilizationRate = availableBudget > 0 ? Math.round((totalAllocated / availableBudget) * 10000) / 100 : 0;

    const totalPriorityScore = Math.round(selectedApps.reduce((acc, a) => acc + (Number(a.priorityScore) || 0), 0) * 10) / 10;
    const avgSelectedGpa =
      selectedApps.length > 0
        ? Math.round((selectedApps.reduce((acc, a) => acc + (Number(a.gpa) || 0), 0) / selectedApps.length) * 100) / 100
        : 0;

    // Department breakdown
    const departmentStats: Record<string, { count: number; requested: number; allocated: number; selected: number }> = {};
    for (const app of allApps) {
      const dept = app.department || 'Other';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, requested: 0, allocated: 0, selected: 0 };
      }
      departmentStats[dept].count++;
      departmentStats[dept].requested += Number(app.scholarshipAmount) || 0;
      if (app.status === 'Approved' || app.status === 'Selected') {
        departmentStats[dept].selected++;
        departmentStats[dept].allocated += Number(app.awardedAmount || app.scholarshipAmount) || 0;
      }
    }

    // Status breakdown
    const statusCounts: Record<string, number> = {
      Draft: 0,
      Submitted: 0,
      'Under Review': 0,
      Selected: 0,
      'Not Selected': 0,
      Approved: 0,
      Rejected: 0,
    };
    for (const app of allApps) {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    }

    // Recent finalized allocation
    const latestAllocation = await AllocationRepo.findOne({ academicYear: academicYear as string });

    res.json({
      success: true,
      stats: {
        academicYear,
        totalStudents,
        totalApplications,
        selectedStudentsCount: selectedApps.length,
        unselectedStudentsCount: unselectedApps.length,
        pendingReviewCount: underReviewApps.length,
        availableBudget,
        totalRequested,
        totalAllocatedAmount: totalAllocated,
        remainingBudget,
        budgetUtilizationRate,
        totalPriorityScoreAchieved: totalPriorityScore,
        avgSelectedGpa,
        isBudgetFinalized: budgetDoc?.isFinalized || false,
        departmentBreakdown: departmentStats,
        statusBreakdown: statusCounts,
        latestAllocationId: latestAllocation?._id,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to retrieve dashboard stats.' });
  }
});

export default router;

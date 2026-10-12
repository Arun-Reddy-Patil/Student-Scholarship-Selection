import { Router, Response } from 'express';
import { ApplicationRepo } from '../models/Application.js';
import { BudgetRepo } from '../models/Budget.js';
import { AllocationRepo } from '../models/Allocation.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET Selection Report Data (JSON)
router.get('/selection', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { academicYear = '2025-2026' } = req.query;

    const budget = await BudgetRepo.findOne({ academicYear: academicYear as string });
    const apps = await ApplicationRepo.find({ cycleYear: academicYear as string });
    const allocations = await AllocationRepo.find({ academicYear: academicYear as string });

    const selected = apps.filter((a) => a.status === 'Approved' || a.status === 'Selected');
    const unselected = apps.filter((a) => a.status === 'Not Selected' || a.status === 'Rejected');

    res.json({
      success: true,
      report: {
        academicYear,
        generatedAt: new Date().toISOString(),
        budget,
        totalApplications: apps.length,
        selectedCount: selected.length,
        unselectedCount: unselected.length,
        totalAwarded: selected.reduce((sum, a) => sum + (a.awardedAmount || a.scholarshipAmount || 0), 0),
        selected,
        unselected,
        allocationHistory: allocations,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate selection report.' });
  }
});

// GET CSV Export
router.get('/selection/export', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { academicYear = '2025-2026', format = 'csv' } = req.query;

    const apps = await ApplicationRepo.find({ cycleYear: academicYear as string });

    // Prepare CSV rows
    const headers = [
      'Student ID',
      'Student Name',
      'Email',
      'Department',
      'Course',
      'Academic Year',
      'GPA',
      'Requested Amount ($)',
      'Priority Score',
      'Merit Score',
      'Need Score',
      'Status',
      'Awarded Amount ($)',
      'Decision Date',
      'Reviewer Notes',
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = apps.map((a) => [
      escapeCsv(a.studentId),
      escapeCsv(a.studentName),
      escapeCsv(a.email),
      escapeCsv(a.department),
      escapeCsv(a.course),
      escapeCsv(a.academicYear),
      escapeCsv(a.gpa),
      escapeCsv(a.scholarshipAmount),
      escapeCsv(a.priorityScore),
      escapeCsv(a.meritScore),
      escapeCsv(a.financialNeedScore),
      escapeCsv(a.status),
      escapeCsv(a.awardedAmount || 0),
      escapeCsv(a.decisionDate || 'Pending'),
      escapeCsv(a.reviewerNotes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="scholarship_selection_report_${academicYear}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to export selection CSV.' });
  }
});

export default router;

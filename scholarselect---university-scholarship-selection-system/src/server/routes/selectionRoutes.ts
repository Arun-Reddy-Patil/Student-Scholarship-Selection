import { Router, Response } from 'express';
import { ApplicationRepo } from '../models/Application.js';
import { BudgetRepo } from '../models/Budget.js';
import { AllocationRepo, IAllocation } from '../models/Allocation.js';
import { runScholarshipSelection } from '../services/selectionAlgorithm.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Run 0/1 Knapsack optimization algorithm (Dry-run / Evaluation)
router.post('/run', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      academicYear = '2025-2026',
      customBudget,
      candidateStatusFilter = ['Submitted', 'Under Review'],
      departmentFilter,
      minimumScore = 0,
    } = req.body;

    // 1. Fetch budget
    let targetBudgetAmount = 0;
    const budgetDoc = await BudgetRepo.findOne({ academicYear });

    if (customBudget !== undefined && !isNaN(Number(customBudget))) {
      targetBudgetAmount = Number(customBudget);
    } else if (budgetDoc) {
      targetBudgetAmount = budgetDoc.totalBudget;
    } else {
      targetBudgetAmount = 50000;
    }

    // 2. Fetch candidate applications
    let applications = await ApplicationRepo.find({ cycleYear: academicYear });

    // Filter by eligible statuses if specified
    if (Array.isArray(candidateStatusFilter) && candidateStatusFilter.length > 0) {
      applications = applications.filter((app) => candidateStatusFilter.includes(app.status));
    }

    if (departmentFilter && departmentFilter !== 'All') {
      applications = applications.filter((app) => app.department === departmentFilter);
    }

    if (minimumScore > 0) {
      applications = applications.filter((app) => app.priorityScore >= Number(minimumScore));
    }

    // 3. Execute 0/1 Knapsack selection algorithm
    const optimizationResult = runScholarshipSelection(applications, targetBudgetAmount, academicYear);

    // Save as preview allocation record
    const allocationDoc = await AllocationRepo.create({
      academicYear,
      budgetId: budgetDoc?._id,
      availableBudget: optimizationResult.availableBudget,
      totalCost: optimizationResult.totalCost,
      remainingBudget: optimizationResult.remainingBudget,
      totalPriorityScore: optimizationResult.totalPriorityScore,
      budgetUtilizationRate: optimizationResult.budgetUtilizationRate,
      selectedCount: optimizationResult.selectedStudents.length,
      unselectedCount: optimizationResult.unselectedStudents.length,
      totalApplicantsEvaluated: applications.length,
      selectedStudents: optimizationResult.selectedStudents,
      unselectedStudents: optimizationResult.unselectedStudents,
      algorithm: optimizationResult.algorithmSummary.algorithmName,
      algorithmVersion: optimizationResult.algorithmSummary.algorithmVersion,
      executionTimeMs: optimizationResult.algorithmSummary.executionTimeMs,
      isFinalized: false,
      notes: `Run by ${req.user?.name || 'Administrator'} for cycle ${academicYear}.`,
    });

    res.json({
      ...optimizationResult,
      allocationId: allocationDoc._id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Optimization algorithm execution failed.' });
  }
});

// GET all past allocation runs
router.get('/results', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { academicYear } = req.query;
    let allocations = await AllocationRepo.find();

    if (academicYear && typeof academicYear === 'string') {
      allocations = allocations.filter((a) => a.academicYear === academicYear);
    }

    allocations.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    res.json({
      success: true,
      count: allocations.length,
      results: allocations,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch allocation records.' });
  }
});

// GET specific allocation run by ID
router.get('/results/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allocation = await AllocationRepo.findById(req.params.id);
    if (!allocation) {
      res.status(404).json({ success: false, message: 'Allocation record not found.' });
      return;
    }

    res.json({
      success: true,
      allocation,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch allocation details.' });
  }
});

// POST Finalize and commit scholarship allocation
router.post('/finalize', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { allocationId, notes } = req.body;

    if (!allocationId) {
      res.status(400).json({ success: false, message: 'Allocation ID is required to finalize.' });
      return;
    }

    const allocation = await AllocationRepo.findById(allocationId);
    if (!allocation) {
      res.status(404).json({ success: false, message: 'Allocation record not found.' });
      return;
    }

    if (allocation.isFinalized) {
      res.status(400).json({
        success: false,
        message: 'This allocation has already been finalized and committed.',
      });
      return;
    }

    // Re-verify budget
    const budgetDoc = await BudgetRepo.findOne({ academicYear: allocation.academicYear });
    if (budgetDoc && allocation.totalCost > budgetDoc.totalBudget) {
      res.status(400).json({
        success: false,
        message: `Validation error: Total allocated cost ($${allocation.totalCost.toLocaleString()}) exceeds active budget ($${budgetDoc.totalBudget.toLocaleString()}).`,
      });
      return;
    }

    const now = new Date().toISOString();
    const adminName = req.user?.name || 'Administrator';

    // 1. Update all selected applications to 'Approved'
    for (const sel of allocation.selectedStudents) {
      const app = await ApplicationRepo.findOne({
        $or: [{ _id: sel.applicationId }, { studentId: sel.studentId }],
      });
      if (app) {
        await ApplicationRepo.findByIdAndUpdate(app._id!, {
          status: 'Approved',
          awardedAmount: sel.scholarshipAmount,
          decisionDate: now,
          reviewerNotes: `Approved in optimization allocation run (${allocation.algorithm}). Awarded $${sel.scholarshipAmount.toLocaleString()}.`,
        });
      }
    }

    // 2. Update all unselected applications to 'Not Selected'
    for (const unsel of allocation.unselectedStudents) {
      const app = await ApplicationRepo.findOne({
        $or: [{ _id: unsel.applicationId }, { studentId: unsel.studentId }],
      });
      if (app && app.status !== 'Approved') {
        await ApplicationRepo.findByIdAndUpdate(app._id!, {
          status: 'Not Selected',
          awardedAmount: 0,
          decisionDate: now,
          reviewerNotes: unsel.reasonUnselected || 'Not selected due to budget constraint.',
        });
      }
    }

    // 3. Mark Allocation as finalized
    const updatedAllocation = await AllocationRepo.findByIdAndUpdate(allocation._id!, {
      isFinalized: true,
      finalizedAt: now,
      finalizedBy: adminName,
      notes: notes || `Finalized and published by ${adminName}.`,
    });

    // 4. Update Budget record
    if (budgetDoc) {
      await BudgetRepo.findByIdAndUpdate(budgetDoc._id!, {
        allocatedBudget: allocation.totalCost,
        remainingBudget: Math.max(0, budgetDoc.totalBudget - allocation.totalCost),
        isFinalized: true,
      });
    }

    res.json({
      success: true,
      message: `Allocation successfully finalized! ${allocation.selectedStudents.length} students approved with $${allocation.totalCost.toLocaleString()} awarded.`,
      allocation: updatedAllocation,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to finalize scholarship allocations.' });
  }
});

export default router;

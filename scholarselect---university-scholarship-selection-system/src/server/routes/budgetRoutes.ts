import { Router, Response } from 'express';
import { BudgetRepo, IBudget } from '../models/Budget.js';
import { ApplicationRepo } from '../models/Application.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET budget (Active or specific cycle)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { academicYear = '2025-2026' } = req.query;

    let budget = await BudgetRepo.findOne({ academicYear: academicYear as string });

    if (!budget) {
      // Create a default if none exists
      budget = await BudgetRepo.create({
        academicYear: academicYear as string,
        title: `University Scholarship Budget ${academicYear}`,
        totalBudget: 50000,
        allocatedBudget: 0,
        remainingBudget: 50000,
        isFinalized: false,
        history: [
          {
            date: new Date().toISOString(),
            previousBudget: 0,
            newBudget: 50000,
            changedBy: 'System Initialization',
            notes: 'Default budget created.',
          },
        ],
      });
    }

    // Compute live stats from applications
    const apps = await ApplicationRepo.find({ cycleYear: budget.academicYear });
    const totalRequested = apps.reduce((sum, a) => sum + (Number(a.scholarshipAmount) || 0), 0);
    const approvedApps = apps.filter((a) => a.status === 'Approved');
    const liveAllocated = approvedApps.reduce((sum, a) => sum + (Number(a.awardedAmount) || 0), 0);

    const remaining = Math.max(0, budget.totalBudget - liveAllocated);

    res.json({
      success: true,
      budget: {
        ...budget,
        totalRequested,
        allocatedBudget: liveAllocated,
        remainingBudget: remaining,
        applicationCount: apps.length,
        approvedCount: approvedApps.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch budget.' });
  }
});

// POST create budget for academic cycle
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { academicYear, title, totalBudget, notes } = req.body;

    if (!academicYear || totalBudget === undefined) {
      res.status(400).json({ success: false, message: 'Academic Year and Total Budget are required.' });
      return;
    }

    const cleanAmount = Number(totalBudget);
    if (isNaN(cleanAmount) || cleanAmount < 0) {
      res.status(400).json({ success: false, message: 'Total Budget must be a non-negative number.' });
      return;
    }

    const existing = await BudgetRepo.findOne({ academicYear });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `A budget for Academic Year ${academicYear} already exists. Update it instead.`,
      });
      return;
    }

    const newBudget = await BudgetRepo.create({
      academicYear: academicYear.trim(),
      title: title?.trim() || `Scholarship Fund ${academicYear}`,
      totalBudget: cleanAmount,
      allocatedBudget: 0,
      remainingBudget: cleanAmount,
      isFinalized: false,
      history: [
        {
          date: new Date().toISOString(),
          previousBudget: 0,
          newBudget: cleanAmount,
          changedBy: req.user?.name || 'Administrator',
          notes: notes || 'Initial budget allocation established.',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship budget created successfully.',
      budget: newBudget,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create budget.' });
  }
});

// PUT update budget
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const budget = await BudgetRepo.findById(req.params.id);
    if (!budget) {
      res.status(404).json({ success: false, message: 'Budget record not found.' });
      return;
    }

    const { totalBudget, title, notes } = req.body;

    if (totalBudget === undefined) {
      res.status(400).json({ success: false, message: 'Total budget amount is required.' });
      return;
    }

    const newAmount = Number(totalBudget);
    if (isNaN(newAmount) || newAmount < 0) {
      res.status(400).json({ success: false, message: 'Budget must be a valid non-negative number.' });
      return;
    }

    // Constraint: Check whether new budget is strictly below already finalized allocated amount
    if (budget.isFinalized && newAmount < budget.allocatedBudget) {
      res.status(400).json({
        success: false,
        message: `Cannot lower budget to $${newAmount.toLocaleString()} because $${budget.allocatedBudget.toLocaleString()} has already been finalized and awarded.`,
      });
      return;
    }

    const previousAmount = budget.totalBudget;
    const historyEntry = {
      date: new Date().toISOString(),
      previousBudget: previousAmount,
      newBudget: newAmount,
      changedBy: req.user?.name || 'Administrator',
      notes: notes || `Budget updated from $${previousAmount.toLocaleString()} to $${newAmount.toLocaleString()}`,
    };

    const remaining = Math.max(0, newAmount - budget.allocatedBudget);

    const updated = await BudgetRepo.findByIdAndUpdate(req.params.id, {
      totalBudget: newAmount,
      title: title ? title.trim() : budget.title,
      remainingBudget: remaining,
      history: [...(budget.history || []), historyEntry],
    });

    res.json({
      success: true,
      message: `Budget successfully updated to $${newAmount.toLocaleString()}.`,
      budget: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update budget.' });
  }
});

export default router;

import { Router, Response } from 'express';
import { runScholarshipSelection } from '../services/selectionAlgorithm.js';
import { calculatePriorityScore } from './applicationRoutes.js';
import { IApplication } from '../models/Application.js';

const router = Router();

interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  durationMs: number;
  details?: string;
}

// Run comprehensive automated test suite
router.get('/run-suite', async (req, res: Response) => {
  const results: TestCaseResult[] = [];

  // TEST 1: Classic 0/1 Knapsack benchmark
  // Items: (cost: 10, val: 60), (cost: 20, val: 100), (cost: 30, val: 120). Budget: 50.
  // Optimal: items 2 and 3 -> cost 50, val 220.
  {
    const start = performance.now();
    const mockApps: Partial<IApplication>[] = [
      { studentId: 'TEST-1', studentName: 'A', scholarshipAmount: 10, priorityScore: 60, department: 'CS' },
      { studentId: 'TEST-2', studentName: 'B', scholarshipAmount: 20, priorityScore: 100, department: 'EE' },
      { studentId: 'TEST-3', studentName: 'C', scholarshipAmount: 30, priorityScore: 120, department: 'Math' },
    ];
    const resOpt = runScholarshipSelection(mockApps as IApplication[], 50);
    const passed =
      resOpt.totalPriorityScore === 220 &&
      resOpt.totalCost === 50 &&
      resOpt.selectedStudents.length === 2 &&
      resOpt.selectedStudents.some((s) => s.studentId === 'TEST-2') &&
      resOpt.selectedStudents.some((s) => s.studentId === 'TEST-3');

    results.push({
      id: 'TC-01',
      name: 'Textbook 0/1 Knapsack Global Optimality Verification',
      category: 'Algorithm Correctness',
      passed,
      expected: 'Total Priority Score: 220, Cost: 50, Selected: TEST-2, TEST-3',
      actual: `Total Priority Score: ${resOpt.totalPriorityScore}, Cost: ${resOpt.totalCost}, Selected: ${resOpt.selectedStudents.map((s) => s.studentId).join(', ')}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 2: Deterministic Tie-Breaking by Lower Cost
  // Two candidates with identical priority score 80:
  // Candidate A costs $3,000, Candidate B costs $4,000. Budget $5,000.
  // If only one can be picked with a fixed item, tie breaker MUST choose candidate A (lower cost).
  {
    const start = performance.now();
    const mockApps: Partial<IApplication>[] = [
      { studentId: 'TIE-A', studentName: 'Candidate Cheap', scholarshipAmount: 3000, priorityScore: 80, department: 'CS' },
      { studentId: 'TIE-B', studentName: 'Candidate Expensive', scholarshipAmount: 4000, priorityScore: 80, department: 'Math' },
      { studentId: 'OTHER', studentName: 'Base Candidate', scholarshipAmount: 2000, priorityScore: 70, department: 'EE' },
    ];
    // With budget 5000:
    // Option 1: OTHER ($2000) + TIE-A ($3000) = $5000 cost, 150 score.
    // Option 2: OTHER ($2000) + TIE-B ($4000) = $6000 cost (exceeds budget 5000).
    // Now with budget 4000:
    // Can choose TIE-A ($3000, score 80) vs TIE-B ($4000, score 80).
    // Tie-break rule says lower cost wins ($3000).
    const resTie = runScholarshipSelection(mockApps as IApplication[], 4000);
    const passed =
      resTie.totalPriorityScore === 80 &&
      resTie.totalCost === 3000 &&
      resTie.selectedStudents[0]?.studentId === 'TIE-A';

    results.push({
      id: 'TC-02',
      name: 'Deterministic Tie-Breaking Policy (Lower Cost on Equal Score)',
      category: 'Tie-Breaking Rules',
      passed,
      expected: 'Select Candidate Cheap (TIE-A) at lower cost ($3,000) over TIE-B ($4,000)',
      actual: `Selected: ${resTie.selectedStudents[0]?.studentId} at cost $${resTie.totalCost}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 3: Zero Budget Edge Case
  {
    const start = performance.now();
    const mockApps: Partial<IApplication>[] = [
      { studentId: 'STU-1', studentName: 'Student 1', scholarshipAmount: 5000, priorityScore: 90, department: 'CS' },
    ];
    const resZero = runScholarshipSelection(mockApps as IApplication[], 0);
    const passed =
      resZero.selectedStudents.length === 0 &&
      resZero.totalCost === 0 &&
      resZero.unselectedStudents.length === 1 &&
      resZero.unselectedStudents[0].reasonUnselected.includes('$0');

    results.push({
      id: 'TC-03',
      name: 'Zero Budget Rejection Constraint',
      category: 'Edge Cases',
      passed,
      expected: '0 Selected students, cost = $0, clear unselected reason',
      actual: `${resZero.selectedStudents.length} selected, cost = $${resZero.totalCost}, reason: ${resZero.unselectedStudents[0]?.reasonUnselected}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 4: Zero Applicants Edge Case
  {
    const start = performance.now();
    const resEmpty = runScholarshipSelection([], 50000);
    const passed = resEmpty.selectedStudents.length === 0 && resEmpty.unselectedStudents.length === 0;

    results.push({
      id: 'TC-04',
      name: 'Empty Applicant Pool Graceful Handling',
      category: 'Edge Cases',
      passed,
      expected: 'Empty selection with friendly system notification',
      actual: `0 selected, 0 unselected, success: ${resEmpty.success}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 5: Single Request Exceeding Total Budget
  {
    const start = performance.now();
    const mockApps: Partial<IApplication>[] = [
      { studentId: 'HUGE-1', studentName: 'Mega Requester', scholarshipAmount: 80000, priorityScore: 99, department: 'Bio' },
      { studentId: 'NORM-1', studentName: 'Normal Requester', scholarshipAmount: 10000, priorityScore: 85, department: 'CS' },
    ];
    const resExceed = runScholarshipSelection(mockApps as IApplication[], 50000);
    const passed =
      resExceed.totalCost === 10000 &&
      resExceed.selectedStudents.length === 1 &&
      resExceed.selectedStudents[0].studentId === 'NORM-1' &&
      resExceed.unselectedStudents.some((u) => u.studentId === 'HUGE-1' && u.reasonUnselected.includes('exceeds'));

    results.push({
      id: 'TC-05',
      name: 'Requested Amount Exceeding Total Pool Filter',
      category: 'Budget Constraints',
      passed,
      expected: 'Exclude applicant asking for $80,000 on $50,000 budget, select NORM-1',
      actual: `Selected: ${resExceed.selectedStudents[0]?.studentId}, cost: $${resExceed.totalCost}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 6: Priority Scoring Formula Verification
  {
    const start = performance.now();
    // GPA 4.0 (Merit: 50) + Income $20,000 (Need: 50) = 100
    const score1 = calculatePriorityScore(4.0, 18000);
    // GPA 3.0 (Merit: 37.5) + Income $60,000 (Need: 26) = 63.5
    const score2 = calculatePriorityScore(3.0, 60000);

    const passed = score1.priorityScore === 100 && score2.priorityScore === 63.5;

    results.push({
      id: 'TC-06',
      name: 'Standardized Priority Score Mathematical Formulation',
      category: 'Scoring Logic',
      passed,
      expected: 'Max GPA + Max Need = 100; GPA 3.0 + Mid Need = 63.5',
      actual: `Case 1: ${score1.priorityScore}, Case 2: ${score2.priorityScore}`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 7: Budget Ceiling Invariance
  {
    const start = performance.now();
    const mockApps: Partial<IApplication>[] = [
      { studentId: 'S1', scholarshipAmount: 15000, priorityScore: 90 },
      { studentId: 'S2', scholarshipAmount: 12000, priorityScore: 88 },
      { studentId: 'S3', scholarshipAmount: 10000, priorityScore: 82 },
      { studentId: 'S4', scholarshipAmount: 8000, priorityScore: 78 },
      { studentId: 'S5', scholarshipAmount: 6000, priorityScore: 70 },
    ];
    const budget = 30000;
    const resCeiling = runScholarshipSelection(mockApps as IApplication[], budget);
    const passed = resCeiling.totalCost <= budget;

    results.push({
      id: 'TC-07',
      name: 'Strict Budget Ceiling Non-Violation Invariance',
      category: 'Financial Safety',
      passed,
      expected: `Total Cost <= $${budget}`,
      actual: `Total Cost: $${resCeiling.totalCost} (Remaining: $${resCeiling.remainingBudget})`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  // TEST 8: Invalid and Negative Data Sanitization
  {
    const start = performance.now();
    const mockApps: Partial<IApplication>[] = [
      { studentId: 'BAD-1', scholarshipAmount: -500, priorityScore: 90 },
      { studentId: 'BAD-2', scholarshipAmount: 0, priorityScore: 50 },
      { studentId: 'GOOD-1', scholarshipAmount: 5000, priorityScore: 80 },
    ];
    const resBad = runScholarshipSelection(mockApps as IApplication[], 20000);
    const passed =
      resBad.selectedStudents.length === 1 &&
      resBad.selectedStudents[0].studentId === 'GOOD-1' &&
      resBad.unselectedStudents.length === 2;

    results.push({
      id: 'TC-08',
      name: 'Sanitization of Negative and Zero Cost Items',
      category: 'Data Validation',
      passed,
      expected: 'Ignore negative and zero requested amounts',
      actual: `Filtered ${resBad.unselectedStudents.length} invalid items, selected GOOD-1`,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    });
  }

  const allPassed = results.every((r) => r.passed);

  res.json({
    success: true,
    allPassed,
    totalTests: results.length,
    passedCount: results.filter((r) => r.passed).length,
    failedCount: results.filter((r) => !r.passed).length,
    tests: results,
  });
});

export default router;

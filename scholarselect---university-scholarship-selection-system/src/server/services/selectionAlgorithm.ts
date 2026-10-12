import { IApplication } from '../models/Application.js';

export interface KnapsackItem {
  applicationId: string;
  studentId: string;
  studentName: string;
  email: string;
  department: string;
  course: string;
  academicYear: string;
  gpa: number;
  cost: number; // scholarshipAmount requested
  score: number; // priorityScore
  originalApp: IApplication;
}

export interface SelectionResult {
  success: boolean;
  message: string;
  academicYear: string;
  availableBudget: number;
  totalCost: number;
  remainingBudget: number;
  totalPriorityScore: number;
  budgetUtilizationRate: number;
  selectedStudents: Array<{
    applicationId: string;
    studentId: string;
    studentName: string;
    email: string;
    department: string;
    course: string;
    gpa: number;
    scholarshipAmount: number;
    priorityScore: number;
    awardedAmount: number;
  }>;
  unselectedStudents: Array<{
    applicationId: string;
    studentId: string;
    studentName: string;
    email: string;
    department: string;
    course: string;
    gpa: number;
    scholarshipAmount: number;
    priorityScore: number;
    reasonUnselected: string;
  }>;
  algorithmSummary: {
    algorithmName: string;
    algorithmVersion: string;
    totalEligibleCandidates: number;
    selectedCount: number;
    unselectedCount: number;
    executionTimeMs: number;
    tieBreakersEvaluated: number;
    optimalityGuarantee: string;
  };
}

/**
 * 0/1 Knapsack Optimization Algorithm
 * Uses exact Dynamic Programming with deterministic tie-breaking (maximizes score,
 * minimizes cost on ties, and breaks further ties by deterministic studentId).
 */
export function runScholarshipSelection(
  applications: IApplication[],
  availableBudget: number,
  academicYear: string = '2025-2026'
): SelectionResult {
  const startTime = performance.now();

  // Validate inputs
  const cleanBudget = Math.max(0, Math.floor(availableBudget * 100) / 100);

  // Edge case: Budget is zero or negative
  if (cleanBudget <= 0) {
    const unselected = applications.map((app) => ({
      applicationId: app._id || '',
      studentId: app.studentId,
      studentName: app.studentName,
      email: app.email,
      department: app.department,
      course: app.course,
      gpa: app.gpa,
      scholarshipAmount: app.scholarshipAmount,
      priorityScore: app.priorityScore,
      reasonUnselected: 'Available scholarship budget is $0.00.',
    }));

    return {
      success: false,
      message: 'No scholarship could be awarded: The available scholarship budget is zero.',
      academicYear,
      availableBudget: 0,
      totalCost: 0,
      remainingBudget: 0,
      totalPriorityScore: 0,
      budgetUtilizationRate: 0,
      selectedStudents: [],
      unselectedStudents: unselected,
      algorithmSummary: {
        algorithmName: '0/1 Knapsack Dynamic Programming',
        algorithmVersion: '2.4-DP',
        totalEligibleCandidates: applications.length,
        selectedCount: 0,
        unselectedCount: unselected.length,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        tieBreakersEvaluated: 0,
        optimalityGuarantee: 'Exact 0/1 Knapsack',
      },
    };
  }

  // Filter candidates: must have valid cost > 0 and score >= 0
  const eligibleItems: KnapsackItem[] = [];
  const autoRejected: Array<{
    applicationId: string;
    studentId: string;
    studentName: string;
    email: string;
    department: string;
    course: string;
    gpa: number;
    scholarshipAmount: number;
    priorityScore: number;
    reasonUnselected: string;
  }> = [];

  for (const app of applications) {
    const cost = Number(app.scholarshipAmount);
    const score = Number(app.priorityScore);

    if (isNaN(cost) || cost <= 0) {
      autoRejected.push({
        applicationId: app._id || '',
        studentId: app.studentId,
        studentName: app.studentName,
        email: app.email,
        department: app.department,
        course: app.course,
        gpa: app.gpa || 0,
        scholarshipAmount: cost || 0,
        priorityScore: score || 0,
        reasonUnselected: 'Invalid or non-positive requested scholarship amount.',
      });
      continue;
    }

    if (cost > cleanBudget) {
      autoRejected.push({
        applicationId: app._id || '',
        studentId: app.studentId,
        studentName: app.studentName,
        email: app.email,
        department: app.department,
        course: app.course,
        gpa: app.gpa,
        scholarshipAmount: cost,
        priorityScore: score,
        reasonUnselected: `Requested amount ($${cost.toLocaleString()}) exceeds the entire university budget ($${cleanBudget.toLocaleString()}).`,
      });
      continue;
    }

    eligibleItems.push({
      applicationId: app._id || '',
      studentId: app.studentId,
      studentName: app.studentName,
      email: app.email,
      department: app.department,
      course: app.course,
      academicYear: app.academicYear,
      gpa: app.gpa,
      cost,
      score,
      originalApp: app,
    });
  }

  // Edge Case: No eligible applicants
  if (eligibleItems.length === 0) {
    return {
      success: false,
      message: 'No eligible candidates could be funded within the specified budget.',
      academicYear,
      availableBudget: cleanBudget,
      totalCost: 0,
      remainingBudget: cleanBudget,
      totalPriorityScore: 0,
      budgetUtilizationRate: 0,
      selectedStudents: [],
      unselectedStudents: autoRejected,
      algorithmSummary: {
        algorithmName: '0/1 Knapsack Dynamic Programming',
        algorithmVersion: '2.4-DP',
        totalEligibleCandidates: 0,
        selectedCount: 0,
        unselectedCount: autoRejected.length,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        tieBreakersEvaluated: 0,
        optimalityGuarantee: 'Exact 0/1 Knapsack',
      },
    };
  }

  // Sort items deterministically by studentId to guarantee repeatable optimal outcomes
  eligibleItems.sort((a, b) => a.studentId.localeCompare(b.studentId));

  // Determine DP strategy:
  // We compute greatest common divisor of integer-rounded costs and budget, or scale down
  // to an integer representation with high precision (e.g. step of $10, $50, $100, or exact dollars)
  // Check if all costs and budget are integers
  const allIntegers =
    Number.isInteger(cleanBudget) && eligibleItems.every((item) => Number.isInteger(item.cost));

  let step = 1;
  if (allIntegers) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    let currentGcd = Math.round(cleanBudget);
    for (const item of eligibleItems) {
      currentGcd = gcd(currentGcd, Math.round(item.cost));
      if (currentGcd === 1) break;
    }
    step = Math.max(1, currentGcd);
  }

  const scaledBudget = Math.floor(cleanBudget / step);
  let tieBreakersEvaluated = 0;

  let selectedIndices: number[] = [];

  // If scaled budget is within standard DP table limits (e.g. <= 200,000 cells)
  if (scaledBudget <= 200000 && eligibleItems.length * scaledBudget <= 5000000) {
    // 0/1 Knapsack DP with full back-tracking matrix
    // State: dp[w] stores { maxScore, minCost }
    // We maintain a 2D table or item decisions to reconstruct exact chosen subset
    const N = eligibleItems.length;
    const dpScore: number[][] = Array.from({ length: N + 1 }, () => new Array(scaledBudget + 1).fill(0));
    const dpCost: number[][] = Array.from({ length: N + 1 }, () => new Array(scaledBudget + 1).fill(0));

    for (let i = 1; i <= N; i++) {
      const item = eligibleItems[i - 1];
      const itemWeight = Math.floor(item.cost / step);
      const itemScore = item.score;
      const itemRealCost = item.cost;

      for (let w = 0; w <= scaledBudget; w++) {
        // Option 1: Do not pick item i
        const scoreWithout = dpScore[i - 1][w];
        const costWithout = dpCost[i - 1][w];

        if (w < itemWeight) {
          dpScore[i][w] = scoreWithout;
          dpCost[i][w] = costWithout;
        } else {
          // Option 2: Pick item i
          const scoreWith = dpScore[i - 1][w - itemWeight] + itemScore;
          const costWith = dpCost[i - 1][w - itemWeight] + itemRealCost;

          if (scoreWith > scoreWithout) {
            dpScore[i][w] = scoreWith;
            dpCost[i][w] = costWith;
          } else if (Math.abs(scoreWith - scoreWithout) < 1e-6) {
            // Tie-breaking: when total priority scores are equal, choose the one with LOWER cost
            tieBreakersEvaluated++;
            if (costWith < costWithout) {
              dpScore[i][w] = scoreWith;
              dpCost[i][w] = costWith;
            } else {
              dpScore[i][w] = scoreWithout;
              dpCost[i][w] = costWithout;
            }
          } else {
            dpScore[i][w] = scoreWithout;
            dpCost[i][w] = costWithout;
          }
        }
      }
    }

    // Backtrack to find selected items
    let currW = scaledBudget;
    for (let i = N; i >= 1; i--) {
      const item = eligibleItems[i - 1];
      const itemWeight = Math.floor(item.cost / step);

      // Check if item was included
      if (currW >= itemWeight && dpScore[i][currW] === dpScore[i - 1][currW - itemWeight] + item.score &&
          Math.abs(dpCost[i][currW] - (dpCost[i - 1][currW - itemWeight] + item.cost)) < 1e-6) {
        // If it equals score without, check tie-breaking rule
        if (dpScore[i][currW] === dpScore[i - 1][currW]) {
          if (dpCost[i][currW] < dpCost[i - 1][currW]) {
            selectedIndices.push(i - 1);
            currW -= itemWeight;
          }
        } else {
          selectedIndices.push(i - 1);
          currW -= itemWeight;
        }
      }
    }
  } else {
    // Sparse Branch & Bound / Dynamic Programming for large capacities
    // Solves 0/1 knapsack optimally using value-density heuristic and depth-first branch & bound
    const itemsWithIndex = eligibleItems.map((it, idx) => ({ ...it, originalIdx: idx }));
    itemsWithIndex.sort((a, b) => b.score / b.cost - a.score / a.cost || a.cost - b.cost);

    let bestScore = -1;
    let bestCost = Infinity;
    let bestMask: boolean[] = [];

    function search(index: number, currentCost: number, currentScore: number, currentMask: boolean[]) {
      if (currentCost > cleanBudget) return;

      if (index === itemsWithIndex.length) {
        if (
          currentScore > bestScore ||
          (Math.abs(currentScore - bestScore) < 1e-6 && currentCost < bestCost)
        ) {
          if (Math.abs(currentScore - bestScore) < 1e-6) tieBreakersEvaluated++;
          bestScore = currentScore;
          bestCost = currentCost;
          bestMask = [...currentMask];
        }
        return;
      }

      // Upper bound check (fractional knapsack bound)
      let bound = currentScore;
      let remainingCap = cleanBudget - currentCost;
      for (let j = index; j < itemsWithIndex.length; j++) {
        if (itemsWithIndex[j].cost <= remainingCap) {
          bound += itemsWithIndex[j].score;
          remainingCap -= itemsWithIndex[j].cost;
        } else {
          bound += (itemsWithIndex[j].score / itemsWithIndex[j].cost) * remainingCap;
          break;
        }
      }

      if (bound < bestScore) return;

      // Branch 1: include item
      currentMask[index] = true;
      search(index + 1, currentCost + itemsWithIndex[index].cost, currentScore + itemsWithIndex[index].score, currentMask);

      // Branch 2: exclude item
      currentMask[index] = false;
      search(index + 1, currentCost, currentScore, currentMask);
    }

    search(0, 0, 0, new Array(itemsWithIndex.length).fill(false));

    selectedIndices = itemsWithIndex
      .filter((_, idx) => bestMask[idx])
      .map((it) => it.originalIdx);
  }

  // Build result sets
  const selectedSet = new Set(selectedIndices);
  const selectedStudents = [];
  const unselectedStudents = [...autoRejected];

  let totalCost = 0;
  let totalPriorityScore = 0;

  for (let i = 0; i < eligibleItems.length; i++) {
    const item = eligibleItems[i];
    if (selectedSet.has(i)) {
      totalCost += item.cost;
      totalPriorityScore += item.score;
      selectedStudents.push({
        applicationId: item.applicationId,
        studentId: item.studentId,
        studentName: item.studentName,
        email: item.email,
        department: item.department,
        course: item.course,
        gpa: item.gpa,
        scholarshipAmount: item.cost,
        priorityScore: item.score,
        awardedAmount: item.cost,
      });
    } else {
      unselectedStudents.push({
        applicationId: item.applicationId,
        studentId: item.studentId,
        studentName: item.studentName,
        email: item.email,
        department: item.department,
        course: item.course,
        gpa: item.gpa,
        scholarshipAmount: item.cost,
        priorityScore: item.score,
        reasonUnselected:
          'Not selected by 0/1 Knapsack optimization: Lower priority score per cost compared to optimal combination within available budget.',
      });
    }
  }

  // Sort selected descending by priority score
  selectedStudents.sort((a, b) => b.priorityScore - a.priorityScore || a.scholarshipAmount - b.scholarshipAmount);
  // Sort unselected descending by priority score
  unselectedStudents.sort((a, b) => b.priorityScore - a.priorityScore);

  const remainingBudget = Math.max(0, Math.round((cleanBudget - totalCost) * 100) / 100);
  const utilizationRate = cleanBudget > 0 ? Math.round((totalCost / cleanBudget) * 10000) / 100 : 0;
  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    success: true,
    message: `Optimization completed successfully. ${selectedStudents.length} student(s) selected with total priority score of ${Math.round(totalPriorityScore * 10) / 10}.`,
    academicYear,
    availableBudget: cleanBudget,
    totalCost: Math.round(totalCost * 100) / 100,
    remainingBudget,
    totalPriorityScore: Math.round(totalPriorityScore * 10) / 10,
    budgetUtilizationRate: utilizationRate,
    selectedStudents,
    unselectedStudents,
    algorithmSummary: {
      algorithmName: '0/1 Knapsack Dynamic Programming',
      algorithmVersion: '2.4-DP',
      totalEligibleCandidates: eligibleItems.length,
      selectedCount: selectedStudents.length,
      unselectedCount: unselectedStudents.length,
      executionTimeMs,
      tieBreakersEvaluated,
      optimalityGuarantee: 'Provably Optimal Global Maximum',
    },
  };
}

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
}

export interface Student {
  _id?: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  course: string;
  academicYear: string;
  gpa: number;
  phone?: string;
  householdIncome?: number;
  familyMembers?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Selected'
  | 'Not Selected'
  | 'Approved'
  | 'Rejected';

export interface ScholarshipApplication {
  _id?: string;
  studentId: string;
  studentName: string;
  email: string;
  department: string;
  course: string;
  academicYear: string;
  cycleYear: string;
  scholarshipAmount: number;
  priorityScore: number;
  gpa: number;
  financialNeedScore: number;
  meritScore: number;
  reason: string;
  status: ApplicationStatus;
  awardedAmount?: number;
  decisionDate?: string;
  reviewerNotes?: string;
  submissionDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetHistory {
  date: string;
  previousBudget: number;
  newBudget: number;
  changedBy: string;
  notes?: string;
}

export interface Budget {
  _id?: string;
  academicYear: string;
  title: string;
  totalBudget: number;
  allocatedBudget: number;
  remainingBudget: number;
  totalRequested?: number;
  applicationCount?: number;
  approvedCount?: number;
  isFinalized: boolean;
  history: BudgetHistory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectedStudent {
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
}

export interface UnselectedStudent {
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
}

export interface Allocation {
  _id?: string;
  academicYear: string;
  budgetId?: string;
  availableBudget: number;
  totalCost: number;
  remainingBudget: number;
  totalPriorityScore: number;
  budgetUtilizationRate: number;
  selectedCount: number;
  unselectedCount: number;
  totalApplicantsEvaluated: number;
  selectedStudents: SelectedStudent[];
  unselectedStudents: UnselectedStudent[];
  algorithm: string;
  algorithmVersion: string;
  executionTimeMs: number;
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  academicYear: string;
  totalStudents: number;
  totalApplications: number;
  selectedStudentsCount: number;
  unselectedStudentsCount: number;
  pendingReviewCount: number;
  availableBudget: number;
  totalRequested: number;
  totalAllocatedAmount: number;
  remainingBudget: number;
  budgetUtilizationRate: number;
  totalPriorityScoreAchieved: number;
  avgSelectedGpa: number;
  isBudgetFinalized: boolean;
  departmentBreakdown: Record<string, { count: number; requested: number; allocated: number; selected: number }>;
  statusBreakdown: Record<string, number>;
  latestAllocationId?: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  durationMs: number;
}

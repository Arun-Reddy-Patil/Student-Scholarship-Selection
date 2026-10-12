import mongoose, { Schema } from 'mongoose';
import { GenericModel } from './BaseModel.js';

export interface IAllocatedStudent {
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

export interface IUnselectedStudent {
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

export interface IAllocation {
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
  selectedStudents: IAllocatedStudent[];
  unselectedStudents: IUnselectedStudent[];
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

export const AllocationSchema = new Schema<IAllocation>(
  {
    academicYear: { type: String, required: true },
    budgetId: { type: String },
    availableBudget: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    remainingBudget: { type: Number, required: true },
    totalPriorityScore: { type: Number, required: true },
    budgetUtilizationRate: { type: Number, required: true },
    selectedCount: { type: Number, required: true },
    unselectedCount: { type: Number, required: true },
    totalApplicantsEvaluated: { type: Number, required: true },
    selectedStudents: { type: [Object], default: [] } as any,
    unselectedStudents: { type: [Object], default: [] } as any,
    algorithm: { type: String, default: '0/1 Knapsack Dynamic Programming' },
    algorithmVersion: { type: String, default: '1.0' },
    executionTimeMs: { type: Number, default: 0 },
    isFinalized: { type: Boolean, default: false },
    finalizedAt: { type: String },
    finalizedBy: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const AllocationModel =
  mongoose.models.Allocation || mongoose.model<IAllocation>('Allocation', AllocationSchema);

export const AllocationRepo = new GenericModel<IAllocation>('allocations');

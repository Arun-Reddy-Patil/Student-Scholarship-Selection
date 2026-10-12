import mongoose, { Schema } from 'mongoose';
import { GenericModel } from './BaseModel.js';

export interface IBudgetHistory {
  date: string;
  previousBudget: number;
  newBudget: number;
  changedBy: string;
  notes?: string;
}

export interface IBudget {
  _id?: string;
  academicYear: string;
  title: string;
  totalBudget: number;
  allocatedBudget: number;
  remainingBudget: number;
  isFinalized: boolean;
  history: IBudgetHistory[];
  createdAt?: string;
  updatedAt?: string;
}

export const BudgetSchema = new Schema<IBudget>(
  {
    academicYear: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    totalBudget: { type: Number, required: true, min: 0 },
    allocatedBudget: { type: Number, default: 0, min: 0 },
    remainingBudget: { type: Number, required: true, min: 0 },
    isFinalized: { type: Boolean, default: false },
    history: [
      {
        date: { type: String, required: true },
        previousBudget: { type: Number, required: true },
        newBudget: { type: Number, required: true },
        changedBy: { type: String, required: true },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const BudgetModel =
  mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

export const BudgetRepo = new GenericModel<IBudget>('budgets');

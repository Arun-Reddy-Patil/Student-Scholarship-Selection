import mongoose, { Schema } from 'mongoose';
import { GenericModel } from './BaseModel.js';

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Selected'
  | 'Not Selected'
  | 'Approved'
  | 'Rejected';

export interface IApplication {
  _id?: string;
  studentId: string;
  studentName: string;
  email: string;
  department: string;
  course: string;
  academicYear: string;
  cycleYear: string; // e.g. "2025-2026"
  scholarshipAmount: number; // cost w_i
  priorityScore: number; // value v_i (0 - 100)
  gpa: number;
  financialNeedScore: number; // 0-50 based on household income
  meritScore: number; // 0-50 based on GPA and achievements
  reason: string;
  status: ApplicationStatus;
  awardedAmount?: number;
  decisionDate?: string;
  reviewerNotes?: string;
  submissionDate?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ApplicationSchema = new Schema<IApplication>(
  {
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    cycleYear: { type: String, required: true, default: '2025-2026' },
    scholarshipAmount: { type: Number, required: true, min: 100 },
    priorityScore: { type: Number, required: true, min: 0, max: 100 },
    gpa: { type: Number, required: true, min: 0, max: 4.0 },
    financialNeedScore: { type: Number, default: 0, min: 0, max: 50 },
    meritScore: { type: Number, default: 0, min: 0, max: 50 },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Selected', 'Not Selected', 'Approved', 'Rejected'],
      default: 'Submitted',
    },
    awardedAmount: { type: Number, default: 0 },
    decisionDate: { type: String },
    reviewerNotes: { type: String },
    submissionDate: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ApplicationModel =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);

export const ApplicationRepo = new GenericModel<IApplication>('applications');

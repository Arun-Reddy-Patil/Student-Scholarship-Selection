import mongoose, { Schema } from 'mongoose';
import { GenericModel } from './BaseModel.js';

export interface IStudent {
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
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    gpa: { type: Number, required: true, min: 0.0, max: 4.0 },
    phone: { type: String, trim: true },
    householdIncome: { type: Number },
    familyMembers: { type: Number, default: 4 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export const StudentRepo = new GenericModel<IStudent>('students');

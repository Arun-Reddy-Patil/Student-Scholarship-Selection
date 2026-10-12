import mongoose, { Schema } from 'mongoose';
import { GenericModel } from './BaseModel.js';

export type UserRole = 'admin' | 'student';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  avatarUrl?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Mongoose Schema for MongoDB deployments
export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },
    studentId: { type: String, trim: true },
    avatarUrl: { type: String },
    department: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Active model wrapper supporting both Mongo & Embedded store
export const UserRepo = new GenericModel<IUser>('users');

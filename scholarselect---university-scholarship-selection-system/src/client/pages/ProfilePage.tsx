import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { UserCheck, Mail, Building, GraduationCap, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          User credentials, institutional permissions, and registered department
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-sm">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                Role: {user?.role}
              </span>
              {user?.studentId && (
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {user.studentId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email Address</span>
            </span>
            <span className="font-semibold text-slate-900">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>Department</span>
            </span>
            <span className="font-semibold text-slate-900">
              {user?.department || 'General Academic Affairs'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Security Clearance</span>
            </span>
            <span className="font-semibold text-slate-900">
              {user?.role === 'admin'
                ? 'Full Institutional Administrator (Budget, Algorithms, Allocations)'
                : 'Student Standard Applicant'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

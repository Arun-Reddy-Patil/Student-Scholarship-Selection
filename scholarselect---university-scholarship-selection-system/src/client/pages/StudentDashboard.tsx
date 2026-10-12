import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ScholarshipApplication, Student } from '../types/index.js';
import { StatusIndicator } from '../components/StatusIndicator.js';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  Edit3,
  PlusCircle,
  FileText,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [application, setApplication] = useState<ScholarshipApplication | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const meRes = await api.getMe();
      if (meRes.user.studentProfile) {
        setStudentProfile(meRes.user.studentProfile);
      }

      const appsRes = await api.getApplications();
      if (appsRes.applications.length > 0) {
        setApplication(appsRes.applications[0]);
      } else {
        setApplication(null);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono font-semibold">
                Student Scholarship Portal · {application?.cycleYear || '2025-2026'}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Welcome, {user?.name || 'Student'}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Student ID: <span className="font-mono text-indigo-300">{user?.studentId || 'STU-2026-101'}</span> · Department: {studentProfile?.department || user?.department || 'Computer Science'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={loadData}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('submit-application')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
            >
              {application ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{application ? 'Update Application' : 'Submit Scholarship Application'}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading scholarship records...</span>
        </div>
      ) : !application ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              No Application Submitted Yet for 2025–2026
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              University scholarship endowments are currently accepting applications. Complete your academic statement and requested aid amount to enter the merit and need-based Knapsack selection pool.
            </p>
          </div>
          <button
            onClick={() => onNavigate('submit-application')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Scholarship Application</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Approved Decision Callout Banner */}
          {application.status === 'Approved' && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white border border-emerald-500/40 shadow-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                      Official Committee Decision · Award Granted
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">
                      Congratulations! Your Scholarship Has Been Awarded
                    </h2>
                    <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed max-w-xl">
                      The University Scholarship Committee has selected your application through the 0/1 Knapsack optimization allocation. Your requested funds have been approved and allocated for disbursement.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-xs text-emerald-300 block">Awarded Amount</span>
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">
                    ${(application.awardedAmount || application.scholarshipAmount).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-200/60 block mt-0.5">
                    100% of requested funds funded
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Not Selected Callout Banner */}
          {application.status === 'Not Selected' && (
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Decision Notice: Application Not Selected</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {application.reviewerNotes || 'Due to limited institutional endowment budget, the optimization algorithm was unable to select your application for this cycle. We encourage you to apply for upcoming departmental grants.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lifecycle Status Progress Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
              Application Lifecycle Milestones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {[
                {
                  label: '1. Draft & Submit',
                  date: application.submissionDate ? new Date(application.submissionDate).toLocaleDateString() : 'Completed',
                  isDone: true,
                },
                {
                  label: '2. Under Review',
                  date: 'Merit & Need Scored',
                  isDone: ['Under Review', 'Selected', 'Approved', 'Not Selected', 'Rejected'].includes(application.status),
                },
                {
                  label: '3. Knapsack Optimization',
                  date: 'Budget Constraint Solved',
                  isDone: ['Selected', 'Approved', 'Not Selected'].includes(application.status),
                },
                {
                  label: '4. Decision Published',
                  date: application.decisionDate ? new Date(application.decisionDate).toLocaleDateString() : 'Pending Committee Action',
                  isDone: ['Approved', 'Not Selected', 'Rejected'].includes(application.status),
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs ${
                    step.isDone
                      ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {step.isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{step.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{step.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Statement Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Application Statement of Purpose
                </h3>
                <StatusIndicator status={application.status} />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {application.reason}
              </div>

              {application.reviewerNotes && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Committee Review Feedback:</span>
                  <p>{application.reviewerNotes}</p>
                </div>
              )}
            </div>

            {/* Quick Metrics & Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Application Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Requested Aid:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${application.scholarshipAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Composite Priority Score:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {application.priorityScore} / 100
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Merit Score (GPA {application.gpa}):</span>
                  <span className="font-mono text-slate-700">{application.meritScore} / 50</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Financial Need Score:</span>
                  <span className="font-mono text-slate-700">
                    {application.financialNeedScore} / 50
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Year:</span>
                  <span className="text-slate-700">{application.academicYear}</span>
                </div>
              </div>

              {['Draft', 'Submitted'].includes(application.status) && (
                <button
                  onClick={() => onNavigate('submit-application')}
                  className="w-full mt-2 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Edit Application Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

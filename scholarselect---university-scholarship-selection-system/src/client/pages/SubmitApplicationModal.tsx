import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ScholarshipApplication, Student } from '../types/index.js';
import {
  DollarSign,
  GraduationCap,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SubmitApplicationModalProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const SubmitApplicationModal: React.FC<SubmitApplicationModalProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [existingApp, setExistingApp] = useState<ScholarshipApplication | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [requestedAmount, setRequestedAmount] = useState<number>(6500);
  const [reason, setReason] = useState<string>('');
  const [cycleYear, setCycleYear] = useState<string>('2025-2026');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [meRes, appRes] = await Promise.all([api.getMe(), api.getApplications()]);
        if (meRes.user.studentProfile) {
          setStudentProfile(meRes.user.studentProfile);
        }
        if (appRes.applications.length > 0) {
          const app = appRes.applications[0];
          setExistingApp(app);
          setRequestedAmount(app.scholarshipAmount);
          setReason(app.reason);
          setCycleYear(app.cycleYear || '2025-2026');
        }
      } catch (err: any) {
        console.error('Failed to load application form:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute live score preview
  const gpa = studentProfile?.gpa || 3.8;
  const income = studentProfile?.householdIncome || 35000;
  const meritScore = Math.round((Math.min(4.0, gpa) / 4.0) * 50 * 10) / 10;
  let needScore = 36;
  if (income <= 20000) needScore = 50;
  else if (income <= 35000) needScore = 44;
  else if (income <= 50000) needScore = 36;
  else if (income <= 70000) needScore = 26;
  else if (income <= 90000) needScore = 18;
  else needScore = 10;

  const previewPriorityScore = Math.min(100, meritScore + needScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requestedAmount <= 0) {
      setError('Scholarship amount requested must be greater than $0.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a statement of purpose or academic reason for your scholarship application.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (existingApp?._id) {
        await api.updateApplication(existingApp._id, {
          scholarshipAmount: requestedAmount,
          reason,
          status: 'Submitted',
        });
      } else {
        await api.createApplication({
          studentId: user?.studentId || 'STU-2026-101',
          studentName: user?.name || 'Student Applicant',
          email: user?.email || '',
          department: studentProfile?.department || user?.department || 'General Studies',
          course: studentProfile?.course || 'Undergraduate Degree',
          academicYear: studentProfile?.academicYear || '3rd Year',
          cycleYear,
          scholarshipAmount: requestedAmount,
          reason,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-slate-500 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Loading application form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {existingApp ? 'Update Scholarship Application' : 'Submit Scholarship Application'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle {cycleYear} · Student ID: {user?.studentId || 'STU-2026-101'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Profile Snapshot */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Applicant Name</span>
            <span className="font-bold text-slate-900">{user?.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Department & Degree</span>
            <span className="font-semibold text-slate-800">
              {studentProfile?.department || user?.department || 'Computer Science'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Current Cumulative GPA</span>
            <span className="font-mono font-bold text-indigo-700">
              {studentProfile?.gpa ? studentProfile.gpa.toFixed(2) : '3.80'} / 4.0
            </span>
          </div>
        </div>

        {/* Live Priority Score Preview */}
        <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Computed Priority Score Preview: {previewPriorityScore} / 100
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-indigo-700">
              Value Weight (v_i)
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Based on your verified academic merit ({meritScore} pts) and financial need tier ({needScore} pts), your application carries an institutional priority score of <strong>{previewPriorityScore}</strong>. The 0/1 Knapsack optimization algorithm maximizes this score when allocating available budget.
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Scholarship Amount Requested ($ USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-sm">
                $
              </span>
              <input
                type="number"
                step="250"
                min="500"
                max="25000"
                required
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(parseFloat(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Represents the cost parameter (w_i) submitted into the Knapsack optimization engine. Typical university grant: $2,500 – $10,000.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Statement of Purpose & Hardship Justification *
            </label>
            <textarea
              rows={6}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail your academic research goals, family financial hardship, extracurricular contributions, or specific educational expenses (tuition, textbooks, lab equipment, living costs)..."
              className="w-full p-4 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Reviewed by the University Scholarship Committee during the priority score evaluation stage.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{existingApp ? 'Update & Resubmit Application' : 'Submit Application'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';

interface DemoSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoSwitcherModal: React.FC<DemoSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { switchDemoAccount, user } = useAuth();

  if (!isOpen) return null;

  const demoAccounts = [
    {
      role: 'admin',
      name: 'Dr. Eleanor Vance',
      title: 'Dean of Student Affairs & Aid Committee Chair',
      email: 'admin@university.edu',
      password: 'Admin@123456',
      badge: 'Full Administrative & Algorithm Access',
      description: 'Configure university budget, adjust candidate priority scores, execute 0/1 Knapsack optimization, and finalize awards.',
    },
    {
      role: 'student',
      name: 'Arun Reddy',
      title: 'Undergraduate Computer Science (3rd Year)',
      email: 'arun.student@university.edu',
      password: 'Student@123456',
      badge: 'STU-2026-101 · Priority Score 90',
      description: 'Requested $6,500. View application status, statement of purpose, and real-time scholarship decision letters.',
    },
    {
      role: 'student',
      name: 'Sophia Rodriguez',
      title: 'Biomedical Engineering (4th Year)',
      email: 'sophia.rodriguez@university.edu',
      password: 'Student@123456',
      badge: 'STU-2026-104 · Priority Score 97',
      description: 'Highest priority candidate ($7,500 requested, GPA 3.96). Demonstrates optimal Knapsack selection.',
    },
    {
      role: 'student',
      name: 'Maya Lin',
      title: 'Electrical Engineering (Graduate)',
      email: 'maya.lin@university.edu',
      password: 'Student@123456',
      badge: 'STU-2026-102 · Priority Score 83',
      description: 'Graduate applicant ($8,000 requested). Test student-side updates and decision verification.',
    },
  ];

  const handleSelect = async (email: string, pass: string) => {
    try {
      await switchDemoAccount(email, pass);
      onClose();
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Switch Demo Persona</h3>
            <p className="text-xs text-slate-500">Test role-based access control and student workflows instantly</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[75vh] overflow-y-auto">
          {demoAccounts.map((acc) => {
            const isCurrent = user?.email === acc.email;
            return (
              <div
                key={acc.email}
                onClick={() => handleSelect(acc.email, acc.password)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        acc.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {acc.role === 'admin' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <GraduationCap className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{acc.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{acc.title}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{acc.description}</p>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <span className="font-mono text-slate-600">{acc.email}</span>
                  <span className="font-medium text-slate-700">{acc.badge}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

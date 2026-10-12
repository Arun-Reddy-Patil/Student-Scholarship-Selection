import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  GraduationCap,
  Users,
  LogOut,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDemoSwitcher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenDemoSwitcher }) => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab(isAdmin ? 'dashboard' : 'student-dashboard')}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-none">
                  ScholarSelect
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  University Aid Portal · 2025–26
                </span>
              </div>
            </button>
          </div>

          {/* Quick Role & User Actions */}
          <div className="flex items-center gap-3">
            {/* Persona Switcher Quick Button */}
            <button
              onClick={onOpenDemoSwitcher}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              title="Quick switch between Admin & Student demo accounts"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch Persona</span>
            </button>

            {/* User profile capsule */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-900 text-indigo-200 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[140px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-indigo-400 capitalize font-mono leading-none">
                      {user.role} {user.studentId ? `· ${user.studentId}` : ''}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                        {user.role === 'admin' ? 'Administrative Access' : 'Student Applicant'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenDemoSwitcher();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 sm:hidden"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Switch Demo Account</span>
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        {user && (
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80 text-xs">
            {isAdmin ? (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => onSelectTab('students')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'students'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Students ({user.role === 'admin' ? 'Directory' : ''})
                </button>
                <button
                  onClick={() => onSelectTab('applications')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'applications'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Applications
                </button>
                <button
                  onClick={() => onSelectTab('budget')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'budget'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Budget Control
                </button>
                <button
                  onClick={() => onSelectTab('run-selection')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'run-selection'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-300 hover:text-indigo-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Knapsack Algorithm</span>
                </button>
                <button
                  onClick={() => onSelectTab('results')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'results'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Selection Results
                </button>
                <button
                  onClick={() => onSelectTab('reports')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'reports'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Reports & CSV
                </button>
                <button
                  onClick={() => onSelectTab('tests')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    currentTab === 'tests'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Algorithm Verification (Tests)</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('student-dashboard')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'student-dashboard'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  My Application Status
                </button>
                <button
                  onClick={() => onSelectTab('submit-application')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'submit-application'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Submit / Update Request
                </button>
                <button
                  onClick={() => onSelectTab('profile')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    currentTab === 'profile'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  Student Profile
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

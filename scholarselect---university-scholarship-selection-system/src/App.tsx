import React, { useState } from 'react';
import { AuthProvider, useAuth } from './client/context/AuthContext.js';
import { Navbar } from './client/components/Navbar.js';
import { DemoSwitcherModal } from './client/components/DemoSwitcherModal.js';
import { AdminDashboard } from './client/pages/AdminDashboard.js';
import { StudentManagement } from './client/pages/StudentManagement.js';
import { ApplicationManagement } from './client/pages/ApplicationManagement.js';
import { BudgetManagement } from './client/pages/BudgetManagement.js';
import { RunSelection } from './client/pages/RunSelection.js';
import { SelectionResults } from './client/pages/SelectionResults.js';
import { ReportsPage } from './client/pages/ReportsPage.js';
import { SystemTestingPage } from './client/pages/SystemTestingPage.js';
import { StudentDashboard } from './client/pages/StudentDashboard.js';
import { SubmitApplicationModal } from './client/pages/SubmitApplicationModal.js';
import { ProfilePage } from './client/pages/ProfilePage.js';
import { Login } from './client/pages/Login.js';
import { RefreshCw, GraduationCap, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading, isAdmin, isStudent } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Sync tab with role on change
  React.useEffect(() => {
    if (isAdmin) {
      if (['student-dashboard', 'submit-application'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    } else if (isStudent) {
      if (['dashboard', 'students', 'budget', 'run-selection', 'results', 'reports', 'tests'].includes(currentTab)) {
        setCurrentTab('student-dashboard');
      }
    }
  }, [isAdmin, isStudent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Initializing ScholarSelect Institutional System...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDemoSwitcher={() => setDemoModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Administrator Routes */}
        {isAdmin && (
          <>
            {currentTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentTab} />}
            {currentTab === 'students' && <StudentManagement />}
            {currentTab === 'applications' && <ApplicationManagement />}
            {currentTab === 'budget' && <BudgetManagement />}
            {currentTab === 'run-selection' && <RunSelection onNavigate={setCurrentTab} />}
            {currentTab === 'results' && <SelectionResults onNavigate={setCurrentTab} />}
            {currentTab === 'reports' && <ReportsPage />}
            {currentTab === 'tests' && <SystemTestingPage />}
            {currentTab === 'profile' && <ProfilePage />}
          </>
        )}

        {/* Student Routes */}
        {isStudent && (
          <>
            {currentTab === 'student-dashboard' && <StudentDashboard onNavigate={setCurrentTab} />}
            {currentTab === 'submit-application' && (
              <SubmitApplicationModal
                onBack={() => setCurrentTab('student-dashboard')}
                onSuccess={() => setCurrentTab('student-dashboard')}
              />
            )}
            {currentTab === 'profile' && <ProfilePage />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">ScholarSelect</span>
            <span>· Student Scholarship Selection System</span>
            <span className="hidden md:inline font-mono text-[11px] text-slate-400">
              (MERN Architecture · 0/1 Knapsack DP)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Switch Persona
            </button>
            <span>·</span>
            {isAdmin ? (
              <button
                onClick={() => setCurrentTab('tests')}
                className="hover:text-slate-800 cursor-pointer"
              >
                Verification Suite
              </button>
            ) : (
              <span className="text-slate-400">Student Access</span>
            )}
            <span>·</span>
            <span className="text-slate-400">AY 2025–2026</span>
          </div>
        </div>
      </footer>

      {/* Demo Persona Switcher Modal */}
      <DemoSwitcherModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

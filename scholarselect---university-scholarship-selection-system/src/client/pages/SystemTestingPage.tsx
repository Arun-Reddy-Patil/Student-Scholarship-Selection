import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { TestCaseResult } from '../types/index.js';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';

export const SystemTestingPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await api.runTestSuite();
      setTestResults(res.tests);
      setAllPassed(res.allPassed);
    } catch (err) {
      console.error('Failed to execute test suite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Algorithm Verification & Automated Test Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit test verification of 0/1 Knapsack optimality, tie-breaking policy, budget invariants, and security rules
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Execute All System Tests</span>
        </button>
      </div>

      {/* Overview Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xs ${
          allPassed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                allPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {allPassed ? <ShieldCheck className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {allPassed ? 'All Verification Tests Passing (100%)' : 'Test Suite Failures Detected'}
              </h2>
              <p className="text-xs mt-0.5 opacity-90">
                {testResults.filter((t) => t.passed).length} of {testResults.length} automated test benchmarks verified against theoretical models.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-semibold self-start sm:self-auto">
            <span>Tests: {testResults.length}</span>
            <span>·</span>
            <span>Passed: {testResults.filter((t) => t.passed).length}</span>
            <span>·</span>
            <span>Failed: {testResults.filter((t) => !t.passed).length}</span>
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {testResults.map((tc) => (
          <div
            key={tc.id}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {tc.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-500 text-[11px]">{tc.id}</span>
                  <span className="font-semibold text-slate-900">{tc.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">[{tc.category}]</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p>
                    <span className="text-slate-400 font-medium">Expected: </span>
                    {tc.expected}
                  </p>
                  <p>
                    <span className="text-slate-400 font-medium">Observed: </span>
                    <strong className="text-slate-800">{tc.actual}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:self-center self-end shrink-0">
              <span className="font-mono text-[11px] text-slate-400">{tc.durationMs} ms</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono ${
                  tc.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {tc.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

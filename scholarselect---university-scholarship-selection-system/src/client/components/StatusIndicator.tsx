import React from 'react';
import { ApplicationStatus } from '../types/index.js';

interface StatusIndicatorProps {
  status: ApplicationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Approved':
      case 'Selected':
        return {
          dot: 'bg-emerald-600',
          text: 'text-emerald-800 font-semibold',
          bg: 'bg-emerald-50 border-emerald-200',
        };
      case 'Submitted':
        return {
          dot: 'bg-blue-600',
          text: 'text-blue-800 font-medium',
          bg: 'bg-blue-50 border-blue-200',
        };
      case 'Under Review':
        return {
          dot: 'bg-amber-500',
          text: 'text-amber-800 font-medium',
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'Draft':
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-700 font-medium',
          bg: 'bg-slate-50 border-slate-200',
        };
      case 'Not Selected':
      case 'Rejected':
        return {
          dot: 'bg-rose-500',
          text: 'text-rose-800 font-medium',
          bg: 'bg-rose-50 border-rose-200',
        };
      default:
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-700 font-medium',
          bg: 'bg-slate-50 border-slate-200',
        };
    }
  };

  const style = getStyles();
  const textClass = size === 'sm' ? 'text-xs' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs tracking-tight ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

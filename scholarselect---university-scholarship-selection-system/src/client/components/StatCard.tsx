import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'default' | 'success' | 'indigo' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}) => {
  const getBorder = () => {
    switch (variant) {
      case 'success':
        return 'border-l-4 border-l-emerald-600';
      case 'indigo':
        return 'border-l-4 border-l-indigo-600';
      case 'warning':
        return 'border-l-4 border-l-amber-500';
      default:
        return 'border-l-4 border-l-slate-400';
    }
  };

  return (
    <div className={`p-5 rounded-xl bg-white border border-slate-200 shadow-xs ${getBorder()}`}>
      <div className="flex items-center justify-between text-slate-500 mb-1">
        <span className="text-xs font-medium tracking-wide uppercase">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && <span className="text-xs font-semibold text-emerald-700">{trend}</span>}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-1.5 leading-normal">{subtitle}</p>}
    </div>
  );
};

import React from 'react';
import { Card } from './Card';

export const StatCard = ({
  label,
  value,
  change,
  icon: Icon,
  trend = 'up',
  className = ''
}) => {
  const isPositive = trend === 'up';

  return (
    <Card variant="elevated" className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          
          {change && (
            <p className={`text-sm font-medium mt-2 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              <span className={isPositive ? '↑' : '↓'} className="mr-1" />
              {Math.abs(change)}% {isPositive ? 'up' : 'down'} from last period
            </p>
          )}
        </div>
        
        {Icon && (
          <div className="p-3 bg-cyan-100 rounded-lg">
            <Icon className="w-6 h-6 text-cyan-600" />
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
    </Card>
  );
};

export const StatsGrid = ({ stats = [] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {stats.map((stat, index) => (
      <StatCard key={index} {...stat} />
    ))}
  </div>
);

export const MetricRow = ({
  label,
  value,
  detail,
  icon: Icon,
  bar,
  className = ''
}) => (
  <div className={`flex items-center justify-between py-3 px-4 hover:bg-slate-50 rounded-lg transition-colors ${className}`}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-slate-100 rounded-lg">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
      )}
      <div>
        <p className="text-sm text-slate-600 font-medium">{label}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
    </div>
    <div className="text-right">
      {bar && (
        <div className="mb-1">
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
              style={{ width: `${bar}%` }}
            />
          </div>
        </div>
      )}
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

export const MetricsList = ({ metrics = [] }) => (
  <Card>
    <div className="divide-y divide-slate-200">
      {metrics.map((metric, index) => (
        <MetricRow key={index} {...metric} />
      ))}
    </div>
  </Card>
);

export const ProgressBar = ({
  label,
  value,
  max = 100,
  color = 'cyan',
  showLabel = true,
  className = ''
}) => {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600'
  };

  return (
    <div className={className}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <span className="text-sm text-slate-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

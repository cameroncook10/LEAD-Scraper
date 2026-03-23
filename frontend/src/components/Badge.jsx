import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    primary: 'bg-indigo-100 text-indigo-800',
    ghost: 'bg-transparent border border-slate-300 text-slate-700'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    active: { label: 'Active', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    failed: { label: 'Failed', variant: 'danger' },
    completed: { label: 'Completed', variant: 'success' },
    running: { label: 'Running', variant: 'info' },
    paused: { label: 'Paused', variant: 'default' },
    draft: { label: 'Draft', variant: 'ghost' },
    qualified: { label: 'Qualified', variant: 'success' },
    unqualified: { label: 'Unqualified', variant: 'danger' },
    hot: { label: 'Hot', variant: 'danger' },
    warm: { label: 'Warm', variant: 'warning' },
    cold: { label: 'Cold', variant: 'default' }
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={config.variant} className={className}>
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
        config.variant === 'success' ? 'bg-emerald-600' :
        config.variant === 'warning' ? 'bg-amber-600' :
        config.variant === 'danger' ? 'bg-red-600' :
        config.variant === 'info' ? 'bg-cyan-600' :
        'bg-slate-600'
      }`}></span>
      {config.label}
    </Badge>
  );
};

export const CountBadge = ({ count, className = '' }) => (
  <span className={`
    inline-flex items-center justify-center
    min-w-5 h-5 px-1.5
    bg-cyan-600 text-white
    text-xs font-bold
    rounded-full
    ${className}
  `}>
    {count > 99 ? '99+' : count}
  </span>
);

import React from 'react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
    outline: 'border border-slate-300 text-slate-900 hover:bg-slate-50 focus:ring-slate-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-2',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-3',
    icon: 'p-2'
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        rounded-md font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {Icon && iconPosition === 'left' && !loading && <Icon className="h-5 w-5" />}
      
      <span>{children}</span>
      
      {Icon && iconPosition === 'right' && !loading && <Icon className="h-5 w-5" />}
    </button>
  );
});

Button.displayName = 'Button';

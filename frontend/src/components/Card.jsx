import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hoverable = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-white border border-slate-200 rounded-lg shadow-sm',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 rounded-lg shadow-lg',
    elevated: 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow',
    flat: 'bg-slate-50 border border-slate-200 rounded-lg'
  };

  return (
    <div
      className={`
        ${variants[variant]}
        ${hoverable ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''}
        p-4 sm:p-6
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg sm:text-xl font-semibold text-slate-900 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`mt-1 text-sm text-slate-600 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-6 flex gap-3 pt-6 border-t border-slate-200 ${className}`} {...props}>
    {children}
  </div>
);

import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  help,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-900 mb-1.5">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        )}
        
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-3 py-2 rounded-md
            border border-slate-300
            bg-white text-slate-900
            placeholder-slate-400
            focus:border-cyan-500 focus:outline-none
            focus:ring-2 focus:ring-cyan-500/10
            transition-colors duration-200
            disabled:bg-slate-100 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      
      {help && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{help}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = React.forwardRef(({
  label,
  error,
  help,
  options = [],
  placeholder = 'Select an option...',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-900 mb-1.5">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-md
          border border-slate-300
          bg-white text-slate-900
          focus:border-cyan-500 focus:outline-none
          focus:ring-2 focus:ring-cyan-500/10
          transition-colors duration-200
          disabled:bg-slate-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      
      {help && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{help}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = React.forwardRef(({
  label,
  error,
  help,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-900 mb-1.5">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-md
          border border-slate-300
          bg-white text-slate-900
          placeholder-slate-400
          focus:border-cyan-500 focus:outline-none
          focus:ring-2 focus:ring-cyan-500/10
          transition-colors duration-200
          disabled:bg-slate-100 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      
      {help && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{help}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Checkbox = React.forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="checkbox"
        className={`
          w-4 h-4 rounded
          border border-slate-300
          bg-white text-cyan-600
          focus:outline-none focus:ring-2 focus:ring-cyan-500/50
          transition-colors duration-200
          disabled:bg-slate-100 disabled:cursor-not-allowed
          cursor-pointer
          ${className}
        `}
        {...props}
      />
      {label && (
        <label className="text-sm text-slate-700 cursor-pointer">
          {label}
        </label>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

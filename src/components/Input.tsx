import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ 
  label, 
  error, 
  className = '',
  ...props 
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brand-blue mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          block w-full 
          rounded-lg 
          bg-brand-dark/50
          border border-brand-purple/20
          focus:border-brand-purple 
          focus:ring-2 
          focus:ring-brand-purple/20 
          text-white 
          placeholder-gray-400 
          py-3 px-4 
          transition-all 
          duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
} 

// Títulos
const titleClasses = "text-white font-bold";
const subtitleClasses = "text-brand-purple-light font-semibold";

// Textos
const textClasses = "text-brand-light"; // Texto principal
const mutedTextClasses = "text-brand-gray"; // Texto secundário

// Links
const linkClasses = "text-brand-purple-light hover:text-brand-purple transition-colors"; 
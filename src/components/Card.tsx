import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`
      bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
} 
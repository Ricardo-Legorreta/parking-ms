import React from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const badgeStyles: Record<Variant, string> = {
  success: 'bg-green-100  text-green-800  border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger : 'bg-red-100    text-red-800    border-red-200',
  info   : 'bg-blue-100   text-blue-800   border-blue-200',
  neutral: 'bg-gray-100   text-gray-700   border-gray-200',
};

export const Badge: React.FC<{ label: string; variant: Variant; className?: string }> = ({ label, variant, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[variant]} ${className}`}>{label}</span>
);

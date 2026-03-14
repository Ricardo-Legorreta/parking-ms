import React from 'react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const alertCfg: Record<AlertVariant, { bg: string; border: string; text: string }> = {
  success: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800'  },
  error  : { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800'    },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  info   : { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800'   },
};

export const Alert: React.FC<{ variant: AlertVariant; message: string; onClose?: () => void }> =
  ({ variant, message, onClose }) => {
  const c = alertCfg[variant];
  return (
    <div className={`flex items-start justify-between gap-2 border rounded-xl p-4 ${c.bg} ${c.border} ${c.text}`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && <button onClick={onClose} className="ml-2 font-bold text-lg leading-none opacity-60 hover:opacity-100">&times;</button>}
    </div>
  );
};

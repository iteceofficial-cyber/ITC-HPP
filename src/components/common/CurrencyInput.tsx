import React from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefix?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  prefix = 'Rp',
}) => {
  const formatDisplay = (num: number): string => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('id-ID');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const parsed = raw ? parseInt(raw, 10) : 0;
    onChange(parsed);
  };

  return (
    <div className={`relative flex items-center ${disabled ? 'opacity-70' : ''}`}>
      {prefix && (
        <span className="absolute left-3 text-xs font-semibold text-slate-400 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        disabled={disabled}
        value={value > 0 ? formatDisplay(value) : ''}
        placeholder={placeholder}
        onChange={handleChange}
        className={`w-full rounded-md border border-slate-300 bg-white py-1.5 text-sm text-slate-800 shadow-xs focus:border-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-600 ${
          prefix ? 'pl-9 pr-3' : 'px-3'
        } ${className}`}
      />
    </div>
  );
};

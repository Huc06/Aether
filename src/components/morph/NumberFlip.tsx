import React, { useState, useEffect } from 'react';

interface NumberFlipProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  stagger?: boolean;
}

export const NumberFlip: React.FC<NumberFlipProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  stagger = true
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    if (value !== prevValue) {
      setDirection(value >= prevValue ? 'forward' : 'back');
      setPrevValue(value);
    }
  }, [value, prevValue]);

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span className={`inline-flex items-center tabular-nums font-mono font-bold ${className}`}>
      {prefix && <span className="opacity-80 mr-0.5">{prefix}</span>}
      <span className="inline-flex overflow-hidden relative">
        {formatted.split('').map((char, index) => {
          const isDigit = /\d/.test(char);
          const key = `${formatted.length - index}-${char}`;
          const delay = stagger ? `${index * 25}ms` : '0ms';

          return isDigit ? (
            <span
              key={key}
              className={`inline-block transition-transform duration-300 ${
                direction === 'forward' ? 'digit-roll-up' : 'digit-roll-down'
              }`}
              style={{ animationDelay: delay }}
            >
              {char}
            </span>
          ) : (
            <span key={key} className="inline-block opacity-75">
              {char}
            </span>
          );
        })}
      </span>
      {suffix && <span className="opacity-80 ml-0.5">{suffix}</span>}
    </span>
  );
};

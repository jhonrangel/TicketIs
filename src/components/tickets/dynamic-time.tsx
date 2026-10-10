'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNowStrict, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface DynamicTimeProps {
  date: Date;
  baseDate?: Date;
  mode: 'distance_to_now' | 'distance' | 'format';
  formatStr?: string;
}

export function DynamicTime({ date, baseDate, mode, formatStr = 'dd/MM/yyyy HH:mm' }: DynamicTimeProps) {
  const [time, setTime] = useState('Calculando...');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    const calculateTime = () => {
      try {
        if (mode === 'distance_to_now') {
          setTime(formatDistanceToNowStrict(date, { addSuffix: true, locale: es }));
        } else if (mode === 'distance' && baseDate) {
          setTime(formatDistanceStrict(date, baseDate, { locale: es }));
        } else if (mode === 'format') {
          setTime(format(date, formatStr, { locale: es }));
        }
      } catch (error) {
        console.error("Error formatting date:", error);
        setTime("Fecha inválida");
      }
    };
    
    calculateTime();
    
    // Optional: Set up an interval to update the time periodically for relative times
    if (mode === 'distance_to_now') {
        const intervalId = setInterval(calculateTime, 60000); // Update every minute
        return () => clearInterval(intervalId);
    }
  }, [date, baseDate, mode, formatStr]);

  const wrapperProps = { className: "text-sm font-medium" };

  return <span {...wrapperProps}>{time}</span>;
}

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  title?: string;
}

export const Text = {
  H1: ({ children, className, id, title }: TypographyProps) => (
    <h1 
      id={id}
      title={title}
      className={cn(
        "text-[22px] font-bold tracking-[-0.5px] text-slate-900 leading-tight",
        className
      )}
    >
      {children}
    </h1>
  ),

  H2: ({ children, className, id, title }: TypographyProps) => (
    <h2 
      id={id}
      title={title}
      className={cn(
        "text-base font-semibold text-slate-800 leading-snug",
        className
      )}
    >
      {children}
    </h2>
  ),

  Amount: ({ children, className, id, title }: TypographyProps) => (
    <span 
      id={id}
      title={title}
      className={cn(
        "text-lg font-bold tabular-nums text-slate-900",
        className
      )}
    >
      {children}
    </span>
  ),

  Label: ({ children, className, id, title }: TypographyProps) => (
    <span 
      id={id}
      title={title}
      className={cn(
        "text-base font-medium text-slate-500",
        className
      )}
    >
      {children}
    </span>
  ),

  Body: ({ children, className, id, title }: TypographyProps) => (
    <p 
      id={id}
      title={title}
      className={cn(
        "text-base font-medium text-slate-500 leading-relaxed",
        className
      )}
    >
      {children}
    </p>
  ),

  Caption: ({ children, className, id, title }: TypographyProps) => (
    <span 
      id={id}
      title={title}
      className={cn(
        "text-base font-medium text-slate-500 leading-normal",
        className
      )}
    >
      {children}
    </span>
  ),
};

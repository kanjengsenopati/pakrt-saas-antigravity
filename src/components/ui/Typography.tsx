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
        "font-headline text-[22px] font-bold tracking-tighter text-slate-900 leading-tight",
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
        "font-headline text-base font-semibold tracking-tight text-slate-800 leading-snug",
        className
      )}
    >
      {children}
    </h2>
  ),

  H3: ({ children, className, id, title }: TypographyProps) => (
    <h3 
      id={id}
      title={title}
      className={cn(
        "font-headline text-[15px] font-bold tracking-tight text-slate-800 leading-snug",
        className
      )}
    >
      {children}
    </h3>
  ),

  H4: ({ children, className, id, title }: TypographyProps) => (
    <h4 
      id={id}
      title={title}
      className={cn(
        "font-headline text-[13px] font-bold tracking-tight text-slate-700 leading-snug",
        className
      )}
    >
      {children}
    </h4>
  ),

  Amount: ({ children, className, id, title }: TypographyProps) => (
    <span 
      id={id}
      title={title}
      className={cn(
        "font-headline text-lg font-bold tabular-nums tracking-tight text-slate-900",
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
        "font-label text-[11px] font-black uppercase tracking-wider text-slate-400",
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
        "font-body text-[14px] font-medium text-slate-600 leading-relaxed",
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
        "font-body text-[11px] font-medium text-slate-400 leading-normal tracking-tight",
        className
      )}
    >
      {children}
    </span>
  ),
};

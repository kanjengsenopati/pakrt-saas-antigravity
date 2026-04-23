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
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler;
  component?: React.ElementType;
  as?: React.ElementType;
}

export const Text = {
  H1: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'h1') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-headline text-[22px] font-bold tracking-tight text-[#1A1A1A] leading-tight",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  H2: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'h2') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-headline text-base font-semibold tracking-tight text-[#1A1A1A] leading-snug",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  H3: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'h3') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-headline text-[15px] font-bold tracking-tight text-[#1A1A1A] leading-snug",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  H4: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'h4') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-headline text-[13px] font-bold tracking-tight text-[#1A1A1A] leading-snug",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  Amount: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'span') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-headline text-lg font-bold tabular-nums tracking-tight text-[#1A1A1A]",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  Label: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'span') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-label text-[11px] font-bold tracking-[0.5px] text-[#6B7280] uppercase",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  Body: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'p') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-body text-[14px] font-medium text-[#6B7280] leading-relaxed",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  Caption: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const Component = (C || as || 'span') as any;
    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-body text-[12px] font-medium italic text-[#6B7280] leading-normal tracking-tight",
          className
        )}
      >
        {children}
      </Component>
    );
  },

  Display: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const { viewMode } = useViewMode();
    const Component = (C || as || 'h1') as any;
    const sizeClasses = {
      mobile: 'text-[32px] md:text-[40px]',
      tablet: 'text-[48px] md:text-[56px]',
      desktop: 'text-[64px] md:text-[72px]'
    };

    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-headline font-extrabold tracking-tighter text-slate-900 leading-[0.95]",
          sizeClasses[viewMode as keyof typeof sizeClasses],
          className
        )}
      >
        {children}
      </Component>
    );
  },

  Subtitle: ({ children, className, id, title, style, onClick, component: C, as }: TypographyProps) => {
    const { viewMode } = useViewMode();
    const Component = (C || as || 'p') as any;
    const sizeClasses = {
      mobile: 'text-base md:text-lg',
      tablet: 'text-lg md:text-xl',
      desktop: 'text-xl md:text-2xl'
    };

    return (
      <Component 
        id={id}
        title={title}
        style={style}
        onClick={onClick}
        className={cn(
          "font-body font-medium text-slate-500 leading-relaxed",
          sizeClasses[viewMode as keyof typeof sizeClasses],
          className
        )}
      >
        {children}
      </Component>
    );
  },
};

import { useViewMode } from '../../contexts/ViewModeContext';

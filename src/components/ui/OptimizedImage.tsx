import React, { useState } from 'react';
import { ImageIcon, CircleNotch, XCircle } from '@phosphor-icons/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName,
  fallbackIcon,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn(
      "relative overflow-hidden bg-slate-100 flex items-center justify-center",
      containerClassName
    )}>
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <CircleNotch className="w-5 h-5 text-brand-500 animate-spin" />
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-4">
          {fallbackIcon || <XCircle size={24} />}
          <span className="text-[10px] font-medium uppercase tracking-tight">Gagal memuat gambar</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-all duration-500",
            isLoading ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0",
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          loading="lazy"
          {...props}
        />
      )}
      
      {!src && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
          <ImageIcon size={24} />
          <span className="text-[10px] font-medium">Tidak ada gambar</span>
        </div>
      )}
    </div>
  );
};

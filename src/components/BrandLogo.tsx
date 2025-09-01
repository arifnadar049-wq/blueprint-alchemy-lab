import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* GRIT Logo Icon - Bold "G" with power symbol */}
      <div className={cn(
        'relative flex items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground font-bold shadow-medium',
        sizeClasses[size]
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-3/5 h-3/5"
        >
          {/* Bold "G" design */}
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.5 0 4.77-.92 6.5-2.44L16.5 17.5C15.4 18.5 13.8 19 12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7c1.93 0 3.68.79 4.95 2.05L18 6C16.32 4.14 14.23 3 12 3z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <path
            d="M12 8v8h4v-3h-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* GRIT Text */}
      {showText && (
        <span className={cn(
          'font-bold tracking-tight text-foreground',
          textSizeClasses[size]
        )}>
          GRIT
        </span>
      )}
    </div>
  );
};
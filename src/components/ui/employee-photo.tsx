'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeePhotoProps {
  photoUrl?: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
  xl: 'h-32 w-32'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export function EmployeePhoto({ 
  photoUrl, 
  name, 
  className, 
  size = 'md',
  fallbackIcon 
}: EmployeePhotoProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-muted flex items-center justify-center",
      sizeClass,
      className
    )}>
      {photoUrl ? (
        // Check if it's a local upload or external URL
        photoUrl.startsWith('/uploads/') ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error and show fallback
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const fallback = parent.querySelector('.fallback-icon');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }
            }}
          />
        ) : (
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="object-cover"
            onError={() => {
              // Handle external image errors
              console.warn(`Failed to load image: ${photoUrl}`);
            }}
          />
        )
      ) : null}
      
      {/* Fallback icon - shown when no photo or on error */}
      <div 
        className={cn(
          "fallback-icon absolute inset-0 flex items-center justify-center text-muted-foreground",
          photoUrl ? "hidden" : "flex"
        )}
        style={{ display: photoUrl ? 'none' : 'flex' }}
      >
        {fallbackIcon || <User className={iconSize} />}
      </div>
    </div>
  );
}

// Variant for use in tables and lists
export function EmployeePhotoSmall({ photoUrl, name, className }: Omit<EmployeePhotoProps, 'size'>) {
  return (
    <EmployeePhoto 
      photoUrl={photoUrl} 
      name={name} 
      size="sm" 
      className={className}
    />
  );
}

// Variant for profile pages
export function EmployeePhotoLarge({ photoUrl, name, className }: Omit<EmployeePhotoProps, 'size'>) {
  return (
    <EmployeePhoto 
      photoUrl={photoUrl} 
      name={name} 
      size="lg" 
      className={className}
    />
  );
}

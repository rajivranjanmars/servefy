import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show shimmer animation effect
   */
  shimmer?: boolean
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 relative overflow-hidden',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent" />
      )}
    </div>
  )
}

/**
 * Text skeleton with multiple lines
 */
function SkeletonText({
  lines = 3,
  className,
  ...props
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Card skeleton for survey cards
 */
function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'border border-white/10 bg-white/5 p-6 space-y-4',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

/**
 * Table row skeleton
 */
function SkeletonTableRow({
  columns = 4,
  className,
  ...props
}: SkeletonProps & { columns?: number }) {
  return (
    <div
      className={cn('flex gap-4 py-3 border-b border-white/10', className)}
      aria-hidden="true"
      {...props}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-5',
            i === 0 ? 'w-1/4' : 'flex-1'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton
 */
function SkeletonAvatar({
  size = 'md',
  className,
  ...props
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
      {...props}
    />
  )
}

/**
 * Button skeleton
 */
function SkeletonButton({
  size = 'default',
  className,
  ...props
}: SkeletonProps & { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-9 w-20',
    default: 'h-11 w-28',
    lg: 'h-14 w-36',
  }

  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonAvatar,
  SkeletonButton,
}

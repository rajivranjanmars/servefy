import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

type ProgressColor = 'default' | 'pink' | 'cyan' | 'lime' | 'orange' | 'violet'

const colorStyles: Record<ProgressColor, string> = {
  default: 'bg-gradient-to-r from-neon-pink via-neon-violet to-neon-cyan',
  pink: 'bg-neon-pink',
  cyan: 'bg-neon-cyan',
  lime: 'bg-neon-lime',
  orange: 'bg-neon-orange',
  violet: 'bg-neon-violet',
}

interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'color'> {
  label?: string
  color?: ProgressColor
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, label, color = 'default', ...props }, ref) => (
  <div>
    {label && (
      <div className="flex justify-between mb-2">
        <span className="text-sm font-bold text-white/80 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold text-neon-cyan">{value}%</span>
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-3 w-full overflow-hidden border-2 border-white/20 bg-white/5',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 transition-all duration-500 ease-out', colorStyles[color])}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
      {/* Animated shimmer effect on progress */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

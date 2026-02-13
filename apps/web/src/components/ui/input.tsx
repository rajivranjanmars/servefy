import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full border-2 border-white/20 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white rounded-none',
          'placeholder:text-white/40',
          'focus-visible:outline-none focus-visible:border-neon-cyan focus-visible:ring-2 focus-visible:ring-neon-cyan/20 focus-visible:bg-white/10',
          'hover:border-white/40 hover:bg-white/[0.07]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-neon-pink file:text-white file:text-sm file:font-medium file:mr-4 file:py-2 file:px-4',
          'transition-all duration-200',
          error && 'border-neon-pink focus-visible:ring-neon-pink/20 focus-visible:border-neon-pink',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// Textarea variant with same styling
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full border-2 border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white rounded-none resize-none',
          'placeholder:text-white/40',
          'focus-visible:outline-none focus-visible:border-neon-cyan focus-visible:ring-2 focus-visible:ring-neon-cyan/20 focus-visible:bg-white/10',
          'hover:border-white/40 hover:bg-white/[0.07]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          error && 'border-neon-pink focus-visible:ring-neon-pink/20 focus-visible:border-neon-pink',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-deep-black disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide',
  {
    variants: {
      variant: {
        // Primary neon pink button with colored shadow
        default:
          'bg-neon-pink text-white border-2 border-white shadow-brutal hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Electric cyan variant
        cyan:
          'bg-neon-cyan text-deep-black border-2 border-deep-black shadow-brutal-pink hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#FF2D92] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Acid lime variant
        lime:
          'bg-neon-lime text-deep-black border-2 border-deep-black shadow-brutal-violet hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#9B5DE5] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Vivid orange variant
        orange:
          'bg-neon-orange text-white border-2 border-white shadow-brutal-cyan hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#00F0FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Electric violet variant
        violet:
          'bg-neon-violet text-white border-2 border-white shadow-brutal-lime hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#B8FF00] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Destructive with glow
        destructive:
          'bg-red-500 text-white border-2 border-white shadow-brutal hover:bg-red-600 hover:shadow-glow-pink active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Outline with gradient border effect
        outline:
          'bg-transparent text-white border-2 border-neon-cyan shadow-brutal-cyan hover:bg-neon-cyan/10 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#00F0FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        // Secondary glass effect
        secondary:
          'bg-white/10 text-white border-2 border-white/20 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 active:bg-white/5',
        // Ghost with neon hover
        ghost: 
          'text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/10 border-2 border-transparent',
        // Link with gradient underline
        link: 
          'text-neon-cyan underline-offset-4 hover:underline decoration-neon-pink',
        // Gradient button - the showstopper
        gradient:
          'bg-gradient-to-r from-neon-pink via-neon-violet to-neon-cyan text-white border-2 border-white shadow-brutal hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-[length:200%_100%] hover:bg-right transition-all duration-500',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-10 text-lg',
        xl: 'h-16 px-12 text-xl',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

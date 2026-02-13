import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'relative overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        // Default glass card with subtle gradient border
        default: 
          'bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/[0.07]',
        // Solid dark card
        solid:
          'bg-deep-slate border-2 border-white/10 hover:border-neon-cyan/50',
        // Gradient border card - stunning effect
        gradient:
          'bg-deep-slate/80 backdrop-blur-md border-2 border-transparent bg-clip-padding [background:linear-gradient(var(--deep-slate),var(--deep-slate))_padding-box,linear-gradient(135deg,#FF2D92,#9B5DE5,#00F0FF)_border-box]',
        // Neon glow card
        glow:
          'bg-deep-slate border-2 border-neon-cyan/30 shadow-glow-cyan hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:border-neon-cyan/60',
        // Pink accent card
        pink:
          'bg-deep-purple/50 backdrop-blur-md border-2 border-neon-pink/30 hover:border-neon-pink/60 hover:shadow-glow-pink',
        // Lime accent card
        lime:
          'bg-deep-slate border-2 border-neon-lime/30 hover:border-neon-lime/60 hover:shadow-glow-lime',
        // Brutal style with colored shadow
        brutal:
          'bg-white text-deep-black border-2 border-deep-black shadow-brutal-pink hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#FF2D92]',
        // Feature card with decorative corner
        feature:
          'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 hover:from-white/15 hover:to-white/10 before:absolute before:top-0 before:right-0 before:w-20 before:h-20 before:bg-gradient-to-bl before:from-neon-pink/20 before:to-transparent',
        // Glass morphism card
        glass:
          'glass border border-white/10 hover:border-white/20',
        // Violet accent card
        violet:
          'bg-deep-purple/50 backdrop-blur-md border-2 border-neon-violet/30 hover:border-neon-violet/60 hover:shadow-glow-violet',
        // Orange accent card
        orange:
          'bg-deep-slate border-2 border-neon-orange/30 hover:border-neon-orange/60',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-2',
        scale: 'hover:scale-[1.02]',
        glow: 'hover:shadow-glow-cyan',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, className }))}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-bold leading-none tracking-tight text-white', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-white/60', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// Decorative gradient blob for card backgrounds
const CardGradientBlob = ({ color = 'pink' }: { color?: 'pink' | 'cyan' | 'violet' | 'lime' }) => {
  const colors = {
    pink: 'bg-neon-pink/30',
    cyan: 'bg-neon-cyan/30',
    violet: 'bg-neon-violet/30',
    lime: 'bg-neon-lime/30',
  }
  
  return (
    <div 
      className={cn(
        'absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl pointer-events-none',
        colors[color]
      )}
      aria-hidden="true"
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardGradientBlob, cardVariants }

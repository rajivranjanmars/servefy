import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, id, ...props }, ref) => {
  const switchId = id || React.useId()
  
  const switchElement = (
    <SwitchPrimitives.Root
      id={switchId}
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center border-2 border-white/20 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-deep-black',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan',
        'data-[state=unchecked]:bg-white/5',
        'hover:border-white/40',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 bg-white shadow-brutal-sm transition-all duration-200',
          'data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-deep-black',
          'data-[state=unchecked]:translate-x-0.5'
        )}
      />
    </SwitchPrimitives.Root>
  )

  if (label) {
    return (
      <div className="flex items-center gap-3">
        {switchElement}
        <label htmlFor={switchId} className="text-sm font-medium cursor-pointer text-white/80 hover:text-white transition-colors">
          {label}
        </label>
      </div>
    )
  }

  return switchElement
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-deep-slate/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-2 group-[.toaster]:border-neon-cyan/30 group-[.toaster]:shadow-brutal-cyan',
          description: 'group-[.toast]:text-white/60',
          actionButton:
            'group-[.toast]:bg-neon-pink group-[.toast]:text-white group-[.toast]:border-2 group-[.toast]:border-white group-[.toast]:font-bold',
          cancelButton:
            'group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:border group-[.toast]:border-white/20',
          success: 'group-[.toaster]:border-neon-lime/50 group-[.toaster]:shadow-brutal-lime',
          error: 'group-[.toaster]:border-neon-pink/50 group-[.toaster]:shadow-brutal-pink',
          warning: 'group-[.toaster]:border-neon-orange/50 group-[.toaster]:shadow-brutal-orange',
          info: 'group-[.toaster]:border-neon-cyan/50 group-[.toaster]:shadow-brutal-cyan',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

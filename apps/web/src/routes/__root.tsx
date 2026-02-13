import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, LayoutDashboard, Menu, Sparkles } from 'lucide-react'

interface RouterContext {
  auth: ReturnType<typeof useAuth>
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      {/* Header - Glass effect with gradient border */}
      <header className="sticky top-0 z-40 bg-deep-black/80 backdrop-blur-xl border-b border-white/10">
        {/* Gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-neon-pink via-neon-violet to-neon-cyan" />
        
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <div className="flex justify-between h-16">
            {/* Logo with gradient */}
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-neon-pink to-neon-violet flex items-center justify-center group-hover:shadow-glow-pink transition-shadow">
                  <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-xl font-black tracking-tight text-white group-hover:text-gradient transition-all">
                  SERVEFY
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoading ? (
                <div className="h-11 w-28 bg-white/5 animate-pulse" />
              ) : isAuthenticated ? (
                <>
                  <Link to="/admin">
                    <Button variant="ghost" className="text-white/70 hover:text-neon-cyan">
                      <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-neon-violet/50 hover:border-neon-violet">
                        <User className="h-4 w-4 mr-2 text-neon-violet" aria-hidden="true" />
                        <span className="max-w-[120px] truncate">{user?.name || user?.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 mr-2 text-neon-cyan" aria-hidden="true" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        className="cursor-pointer text-neon-pink focus:text-neon-pink"
                      >
                        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-white/70 hover:text-white">Sign in</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="gradient">Get Started</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="text-white">
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isAuthenticated ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 mr-2 text-neon-cyan" aria-hidden="true" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        className="cursor-pointer text-neon-pink focus:text-neon-pink"
                      >
                        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/login" className="cursor-pointer">
                          Sign in
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/register" className="cursor-pointer text-neon-pink">
                          Get Started
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>
      </header>

      {/* Main content with landmark */}
      <main id="main-content" className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* Footer - Dark with gradient accents */}
      <footer className="relative border-t border-white/10 py-12 bg-deep-slate">
        {/* Gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo and copyright */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-6 h-6 bg-gradient-to-br from-neon-pink to-neon-violet flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white">SERVEFY</span>
              </Link>
              <p className="text-sm text-white/40">
                &copy; {new Date().getFullYear()} Servefy. All rights reserved.
              </p>
            </div>
            
            {/* Navigation links */}
            <nav aria-label="Footer navigation">
              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
                <li>
                  <Link to="/" className="text-white/60 hover:text-neon-cyan transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/demo" className="text-white/60 hover:text-neon-pink transition-colors">
                    Demo
                  </Link>
                </li>

              </ul>
            </nav>
            
            {/* Social/Status */}
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span className="w-2 h-2 bg-neon-lime rounded-full animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      {/* Dev tools */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}

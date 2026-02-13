import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useId, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowRight, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    // Redirect to admin dashboard if already authenticated
    if (context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({
        to: '/admin',
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login, isLoading: authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const emailId = useId()
  const passwordId = useId()
  const emailErrorId = useId()
  const passwordErrorId = useId()

  // Redirect if user becomes authenticated after initial load
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate({ to: '/admin' })
    }
  }, [authLoading, isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: typeof errors = {}
    if (!email) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate({ to: '/admin' })
    } catch (error) {
      toast.error('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-neon-violet/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-neon-cyan/15 rounded-full blur-[100px]" />
      </div>
      
      <Card variant="gradient" className="w-full max-w-md relative z-10">
        <CardHeader className="text-center pb-2">
          {/* Logo icon */}
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-neon-pink to-neon-violet flex items-center justify-center shadow-brutal-pink">
            <Sparkles className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-white/50">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor={emailId} required>
                Email
              </Label>
              <Input
                id={emailId}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                aria-describedby={errors.email ? emailErrorId : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <p id={emailErrorId} className="text-sm text-neon-pink" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={passwordId} required>
                Password
              </Label>
              <Input
                id={passwordId}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                aria-describedby={errors.password ? passwordErrorId : undefined}
                autoComplete="current-password"
              />
              {errors.password && (
                <p id={passwordErrorId} className="text-sm text-neon-pink" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <Button type="submit" variant="gradient" className="w-full group" disabled={isLoading}>
              {isLoading ? 'Signing in...' : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-white/50">Don&apos;t have an account? </span>
            <Link to="/register" className="font-bold text-neon-cyan hover:text-neon-pink transition-colors">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useId, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowRight, Sparkles, Check } from 'lucide-react'

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    // Redirect to admin dashboard if already authenticated
    if (context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({
        to: '/admin',
      })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const { register, isLoading: authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Handle redirect after auth loading completes (beforeLoad runs too early on initial load)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate({ to: '/admin' })
    }
  }, [authLoading, isAuthenticated, navigate])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const nameErrorId = useId()
  const emailErrorId = useId()
  const passwordErrorId = useId()
  const confirmPasswordErrorId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: typeof errors = {}
    if (!name) newErrors.name = 'Name is required'
    if (!email) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await register(email, password, name)
      toast.success('Account created successfully!')
      navigate({ to: '/admin' })
    } catch (error) {
      toast.error('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-neon-pink border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-neon-pink/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-neon-lime/15 rounded-full blur-[100px]" />
      </div>
      
      <div className="w-full max-w-4xl grid lg:grid-cols-5 gap-8 relative z-10">
        {/* Benefits sidebar */}
        <div className="lg:col-span-2 hidden lg:flex flex-col justify-center">
          <h2 className="text-2xl font-black text-white mb-6">Why Servefy?</h2>
          <ul className="space-y-4">
            {[
              'Create unlimited surveys',
              'Real-time analytics dashboard',
              'Export data anywhere',
              'GDPR compliant by default',
              '24/7 support access',
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-white/70">
                <div className="w-6 h-6 bg-neon-lime/20 border border-neon-lime/30 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-neon-lime" aria-hidden="true" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Registration form */}
        <Card variant="gradient" className="lg:col-span-3">
          <CardHeader className="text-center pb-2">
            {/* Logo icon */}
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-neon-cyan to-neon-lime flex items-center justify-center shadow-brutal-cyan">
              <Sparkles className="h-7 w-7 text-deep-black" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Create account</CardTitle>
            <CardDescription className="text-white/50">Start building surveys today</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor={nameId} required>
                  Name
                </Label>
                <Input
                  id={nameId}
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!errors.name}
                  aria-describedby={errors.name ? nameErrorId : undefined}
                  autoComplete="name"
                />
                {errors.name && (
                  <p id={nameErrorId} className="text-sm text-neon-pink" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

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

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor={passwordId} required>
                    Password
                  </Label>
                  <Input
                    id={passwordId}
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    aria-describedby={errors.password ? passwordErrorId : undefined}
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <p id={passwordErrorId} className="text-sm text-neon-pink" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={confirmPasswordId} required>
                    Confirm Password
                  </Label>
                  <Input
                    id={confirmPasswordId}
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? confirmPasswordErrorId : undefined}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <p id={confirmPasswordErrorId} className="text-sm text-neon-pink" role="alert">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" variant="cyan" className="w-full group" disabled={isLoading}>
                {isLoading ? 'Creating account...' : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-white/50">Already have an account? </span>
              <Link to="/login" className="font-bold text-neon-pink hover:text-neon-cyan transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowRight, BarChart3, Zap, Shield, ClipboardList, Sparkles, Globe, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // Redirect to admin dashboard if already authenticated
    if (context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({
        to: '/admin',
      })
    }
  },
  component: HomePage,
})

function HomePage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Handle redirect after auth loading completes (beforeLoad runs too early on initial load)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate({ to: '/admin' })
    }
  }, [authLoading, isAuthenticated, navigate])

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section - Stunning gradient mesh background */}
      <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-neon-pink/30 rounded-full blur-[120px] animate-float" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-neon-cyan/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-neon-violet/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
        </div>
        
        {/* Dotted pattern overlay */}
        <div className="absolute inset-0 bg-dotted opacity-30" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-neon-cyan/30 bg-neon-cyan/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-neon-cyan" aria-hidden="true" />
              <span className="text-sm font-medium text-neon-cyan uppercase tracking-wider">Now with AI-powered insights</span>
            </div>
            
            {/* Main headline with gradient text */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
              <span className="block text-white">CREATE SURVEYS</span>
              <span className="block mt-2">
                <span className="relative inline-block">
                  <span className="text-gradient-animated">THAT MATTER</span>
                  {/* Decorative underline */}
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" aria-hidden="true">
                    <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF2D92"/>
                        <stop offset="50%" stopColor="#9B5DE5"/>
                        <stop offset="100%" stopColor="#00F0FF"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Build beautiful, accessible surveys in minutes. 
              Get insights that drive decisions. <span className="text-neon-lime">No complexity</span>, just results.
            </p>
            
            {/* CTA buttons with different vibrant colors */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="xl" variant="gradient" className="w-full sm:w-auto group">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">10K+ Surveys Created</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">Enterprise Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Colorful cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="text-center">
            <span className="text-neon-pink font-bold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4 tracking-tight">
              EVERYTHING YOU NEED
            </h2>
            <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
              Powerful tools that make survey creation and analysis effortless
            </p>
          </div>
        </div>
        
        {/* Feature cards grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 - Pink accent */}
            <Card variant="feature" hover="lift" className="group">
              <CardHeader>
                <div className="w-14 h-14 flex items-center justify-center bg-neon-pink/20 border-2 border-neon-pink/30 mb-4 group-hover:bg-neon-pink/30 group-hover:border-neon-pink/50 transition-all">
                  <ClipboardList className="h-7 w-7 text-neon-pink" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">Easy Builder</CardTitle>
                <CardDescription className="text-white/50">
                  Drag-and-drop interface. 20+ question types. Build surveys in minutes.
                </CardDescription>
              </CardHeader>
            </Card>
            
            {/* Card 2 - Cyan accent */}
            <Card variant="feature" hover="lift" className="group">
              <CardHeader>
                <div className="w-14 h-14 flex items-center justify-center bg-neon-cyan/20 border-2 border-neon-cyan/30 mb-4 group-hover:bg-neon-cyan/30 group-hover:border-neon-cyan/50 transition-all">
                  <Zap className="h-7 w-7 text-neon-cyan" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">Lightning Fast</CardTitle>
                <CardDescription className="text-white/50">
                  Edge-powered responses. Sub-50ms load times. Global CDN distribution.
                </CardDescription>
              </CardHeader>
            </Card>
            
            {/* Card 3 - Lime accent */}
            <Card variant="feature" hover="lift" className="group">
              <CardHeader>
                <div className="w-14 h-14 flex items-center justify-center bg-neon-lime/20 border-2 border-neon-lime/30 mb-4 group-hover:bg-neon-lime/30 group-hover:border-neon-lime/50 transition-all">
                  <BarChart3 className="h-7 w-7 text-neon-lime" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">Rich Analytics</CardTitle>
                <CardDescription className="text-white/50">
                  Real-time insights. Visual dashboards. Export anywhere.
                </CardDescription>
              </CardHeader>
            </Card>
            
            {/* Card 4 - Violet accent */}
            <Card variant="feature" hover="lift" className="group">
              <CardHeader>
                <div className="w-14 h-14 flex items-center justify-center bg-neon-violet/20 border-2 border-neon-violet/30 mb-4 group-hover:bg-neon-violet/30 group-hover:border-neon-violet/50 transition-all">
                  <Shield className="h-7 w-7 text-neon-violet" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">Privacy First</CardTitle>
                <CardDescription className="text-white/50">
                  GDPR compliant. Data encryption. You own your data.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section - Glassmorphism with colored accents */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/5 via-neon-violet/5 to-neon-cyan/5" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '10K+', label: 'Surveys Created', color: 'text-neon-pink' },
              { value: '1M+', label: 'Responses Collected', color: 'text-neon-cyan' },
              { value: '99.9%', label: 'Uptime SLA', color: 'text-neon-lime' },
              { value: '< 50ms', label: 'Response Time', color: 'text-neon-violet' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="text-center p-8 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
              >
                <div className={`text-5xl font-black ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-white/50 text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Gradient mesh background */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-mesh-animated opacity-20" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            READY TO GET STARTED?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Join thousands of teams creating better surveys with Servefy.
            <span className="text-neon-lime"> Start free, upgrade when you need.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="xl"
                variant="cyan"
                className="group"
              >
                Create Your First Survey
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button
                size="xl"
                variant="secondary"
              >
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

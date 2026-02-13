import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { ClipboardList, Users, BarChart3, Plus, TrendingUp, Zap } from 'lucide-react'
import type { Survey } from '@survey/types'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await api.get<{ surveys: Survey[] }>('/surveys')
      return response.data.surveys
    },
  })

  const totalSurveys = data?.length ?? 0
  const publishedSurveys = data?.filter(s => s.status === 'published').length ?? 0
  const totalResponses = data?.reduce((acc, s) => acc + s.responseCount, 0) ?? 0

  return (
    <div className="space-y-8">
      {/* Header with gradient text */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-neon-pink/10 via-neon-cyan/10 to-neon-violet/10 blur-3xl -z-10" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-neon-pink to-neon-violet">
            <Zap className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
        </div>
        <p className="text-gray-400">Welcome back! Here&apos;s an overview of your surveys.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card variant="pink" className="group hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Surveys</CardTitle>
            <div className="p-2 bg-neon-pink/20 group-hover:bg-neon-pink/30 transition-colors">
              <ClipboardList className="h-5 w-5 text-neon-pink" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{isLoading ? '-' : totalSurveys}</div>
            <p className="text-sm text-neon-pink mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {publishedSurveys} published
            </p>
          </CardContent>
        </Card>

        <Card variant="glow" className="group hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Responses</CardTitle>
            <div className="p-2 bg-neon-cyan/20 group-hover:bg-neon-cyan/30 transition-colors">
              <Users className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{isLoading ? '-' : totalResponses}</div>
            <p className="text-sm text-neon-cyan mt-1">
              Across all surveys
            </p>
          </CardContent>
        </Card>

        <Card variant="lime" className="group hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg. Response Rate</CardTitle>
            <div className="p-2 bg-neon-lime/20 group-hover:bg-neon-lime/30 transition-colors">
              <BarChart3 className="h-5 w-5 text-neon-lime" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">-</div>
            <p className="text-sm text-neon-lime mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Surveys */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-neon-pink to-neon-cyan" />
            Recent Surveys
          </h2>
          <Link to="/admin/surveys">
            <Button variant="ghost" size="sm" className="text-neon-cyan hover:text-neon-pink">
              View all
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.slice(0, 3).map((survey, index) => (
              <Link key={survey.id} to="/admin/surveys/$id" params={{ id: survey.id }}>
                <Card 
                  variant="glass" 
                  className="hover:shadow-brutal-cyan hover:border-neon-cyan/50 transition-all duration-300 cursor-pointer group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-10 h-10 flex items-center justify-center text-lg font-bold
                          ${index === 0 ? 'bg-neon-pink text-white' : ''}
                          ${index === 1 ? 'bg-neon-cyan text-deep-black' : ''}
                          ${index === 2 ? 'bg-neon-lime text-deep-black' : ''}
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-white group-hover:text-neon-cyan transition-colors">
                            {survey.title}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {survey.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-bold border-2 ${
                          survey.status === 'published'
                            ? 'bg-neon-lime/20 text-neon-lime border-neon-lime'
                            : survey.status === 'draft'
                            ? 'bg-neon-orange/20 text-neon-orange border-neon-orange'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500'
                        }`}
                      >
                        {survey.status.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-neon-cyan" aria-hidden="true" />
                        {survey.responseCount} responses
                      </span>
                      <span>Created {new Date(survey.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card variant="gradient" className="overflow-hidden">
            <CardContent className="py-16 text-center relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 via-transparent to-neon-cyan/5" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-cyan/10 blur-3xl" />
              
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-neon-pink to-neon-violet flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">No surveys yet</h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  Create your first survey to start collecting valuable feedback.
                </p>
                <Link to="/admin/surveys/new">
                  <Button variant="gradient" size="lg">
                    <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                    Create Survey
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

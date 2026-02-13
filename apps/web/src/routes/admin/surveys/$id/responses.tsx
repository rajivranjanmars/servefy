import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonTableRow } from '@/components/ui/skeleton'
import { ArrowLeft, Download, Users, CheckCircle, Clock, HelpCircle, BarChart3, AlertTriangle } from 'lucide-react'
import type { Survey, SurveyResponse } from '@survey/types'

export const Route = createFileRoute('/admin/surveys/$id/responses')({
  component: ResponsesPage,
})

function ResponsesPage() {
  const { id } = Route.useParams()

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const response = await api.get<{ survey: Survey }>(`/surveys/${id}`)
      return response.data.survey
    },
  })

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['survey', id, 'responses'],
    queryFn: async () => {
      const response = await api.get<{ responses: SurveyResponse[] }>(`/responses/survey/${id}`)
      return response.data.responses
    },
  })

  const isLoading = surveyLoading || responsesLoading

  const exportResponses = async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/responses/survey/${id}/export`, {
        params: { format },
        responseType: 'blob',
      })
      
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${survey?.title || 'responses'}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Export failed')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card variant="glass">
          <CardContent className="pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={4} />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <Card variant="gradient" className="max-w-md mx-auto">
          <CardContent className="py-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-neon-orange/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-neon-orange" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">Survey not found</h2>
            <Link to="/admin/surveys">
              <Button variant="cyan">Back to Surveys</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedResponses = responses?.filter(r => r.status === 'completed').length ?? 0
  const completionRate = responses && responses.length > 0
    ? Math.round((completedResponses / responses.length) * 100)
    : 0

  return (
    <div className="space-y-8 relative">
      {/* Background decorations */}
      <div className="absolute -inset-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-violet/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 relative">
        <div>
          <Link 
            to="/admin/surveys/$id" 
            params={{ id }} 
            className="inline-flex items-center text-gray-400 hover:text-neon-cyan mb-4 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            Back to survey
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-neon-violet to-neon-pink">
              <BarChart3 className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{survey.title}</h1>
          </div>
          <p className="text-gray-400">Response data and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportResponses('csv')} className="group">
            <Download className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
            Export CSV
          </Button>
          <Button variant="cyan" onClick={() => exportResponses('json')} className="group">
            <Download className="h-4 w-4 mr-2 group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card variant="glow" className="group hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Total Responses</CardTitle>
              <div className="p-2 bg-neon-cyan/20 group-hover:bg-neon-cyan/30 transition-colors">
                <Users className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{responses?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card variant="pink" className="group hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Completion Rate</CardTitle>
              <div className="p-2 bg-neon-pink/20 group-hover:bg-neon-pink/30 transition-colors">
                <CheckCircle className="h-5 w-5 text-neon-pink" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{completionRate}%</div>
          </CardContent>
        </Card>

        <Card variant="lime" className="group hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Questions</CardTitle>
              <div className="p-2 bg-neon-lime/20 group-hover:bg-neon-lime/30 transition-colors">
                <HelpCircle className="h-5 w-5 text-neon-lime" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{survey.questions?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card variant="glass">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">All Responses</CardTitle>
          <CardDescription className="text-gray-400">View individual survey responses</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {responses && responses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-neon-cyan/30">
                    <th className="text-left py-4 px-3 font-bold text-neon-cyan">ID</th>
                    <th className="text-left py-4 px-3 font-bold text-neon-cyan">Status</th>
                    <th className="text-left py-4 px-3 font-bold text-neon-cyan">Started</th>
                    <th className="text-left py-4 px-3 font-bold text-neon-cyan">Submitted</th>
                    <th className="text-left py-4 px-3 font-bold text-neon-cyan">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response, index) => (
                    <tr 
                      key={response.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-3 font-mono text-xs text-gray-400">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 mr-2 text-xs font-bold
                          ${index % 4 === 0 ? 'bg-neon-pink/20 text-neon-pink' : ''}
                          ${index % 4 === 1 ? 'bg-neon-cyan/20 text-neon-cyan' : ''}
                          ${index % 4 === 2 ? 'bg-neon-lime/20 text-neon-lime' : ''}
                          ${index % 4 === 3 ? 'bg-neon-violet/20 text-neon-violet' : ''}
                        `}>
                          {index + 1}
                        </span>
                        {response.id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`px-3 py-1 text-xs font-bold border flex items-center gap-1 w-fit ${
                            response.status === 'completed'
                              ? 'bg-neon-lime/20 text-neon-lime border-neon-lime/50'
                              : response.status === 'in_progress'
                              ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/50'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                          }`}
                        >
                          {response.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                          {response.status === 'in_progress' && <Clock className="h-3 w-3" />}
                          {response.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-gray-300">
                        {new Date(response.startedAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-gray-300">
                        {response.submittedAt
                          ? new Date(response.submittedAt).toLocaleString()
                          : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="py-4 px-3 text-gray-300">
                        {response.completionTime
                          ? <span className="text-neon-cyan">{Math.round(response.completionTime / 60)}m</span>
                          : <span className="text-gray-500">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-neon-violet/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-neon-violet" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">No responses yet</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Share your survey to start collecting responses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

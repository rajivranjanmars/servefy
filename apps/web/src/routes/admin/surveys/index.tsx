import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, ExternalLink, BarChart3, ClipboardList, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { Survey } from '@survey/types'

export const Route = createFileRoute('/admin/surveys/')({
  component: SurveysListPage,
})

function SurveysListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await api.get<{ surveys: Survey[] }>('/surveys')
      return response.data.surveys
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/surveys/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey deleted')
    },
    onError: () => {
      toast.error('Failed to delete survey')
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/10 via-neon-violet/10 to-neon-pink/10 blur-3xl -z-10" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-neon-cyan to-neon-violet">
              <ClipboardList className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold text-gradient">Surveys</h1>
          </div>
          <p className="text-gray-400">Manage all your surveys</p>
        </div>
        <Link to="/admin/surveys/new">
          <Button variant="gradient" size="lg" className="group">
            <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
            New Survey
            <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
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
          {data.map((survey, index) => (
            <Card 
              key={survey.id} 
              variant="glass"
              className="group hover:border-neon-cyan/50 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-12 h-12 flex items-center justify-center text-lg font-bold shrink-0
                      ${index % 4 === 0 ? 'bg-neon-pink text-white' : ''}
                      ${index % 4 === 1 ? 'bg-neon-cyan text-deep-black' : ''}
                      ${index % 4 === 2 ? 'bg-neon-lime text-deep-black' : ''}
                      ${index % 4 === 3 ? 'bg-neon-violet text-white' : ''}
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
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-6 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                      {survey.responseCount} responses
                    </span>
                    <span>Created {new Date(survey.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {survey.status === 'published' && (
                      <a
                        href={`/s/${survey.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Button variant="ghost" size="sm" className="text-neon-cyan hover:text-neon-lime">
                          <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />
                          View
                        </Button>
                      </a>
                    )}
                    <Link to="/admin/surveys/$id/responses" params={{ id: survey.id }}>
                      <Button variant="ghost" size="sm" className="text-neon-violet hover:text-neon-pink">
                        <BarChart3 className="h-4 w-4 mr-1" aria-hidden="true" />
                        Responses
                      </Button>
                    </Link>
                    <Link to="/admin/surveys/$id" params={{ id: survey.id }}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Delete {survey.title}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{survey.title}&rdquo;? This action cannot be undone.
                            All responses will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(survey.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="gradient" className="overflow-hidden">
          <CardContent className="py-16 text-center relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-violet/10 blur-3xl" />
            
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
                <Plus className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">No surveys yet</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                Create your first survey to start collecting valuable insights.
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
  )
}

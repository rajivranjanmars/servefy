import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useId } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles, Rocket, CheckCircle2, LayoutTemplate, UserRound, Briefcase, GraduationCap } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { Survey, CreateQuestionRequest } from '@survey/types'

export const Route = createFileRoute('/admin/surveys/new')({
  component: NewSurveyPage,
})

function NewSurveyPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string }>({})

  const titleId = useId()
  const descriptionId = useId()
  const titleErrorId = useId()

  const selectedTemplate = SURVEY_TEMPLATES.find((template) => template.id === selectedTemplateId)

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; templateId: string }) => {
      const response = await api.post<{ survey: Survey }>('/surveys', data)
      const survey = response.data.survey
      const template = SURVEY_TEMPLATES.find((candidate) => candidate.id === data.templateId)

      if (template && template.questions.length > 0) {
        for (const question of template.questions) {
          await api.post(`/questions/survey/${survey.id}`, question)
        }
      }

      return { survey, seededQuestionCount: template?.questions.length ?? 0 }
    },
    onSuccess: ({ survey, seededQuestionCount }) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      toast.success(
        seededQuestionCount > 0
          ? `Survey created with ${seededQuestionCount} starter questions`
          : 'Survey created!'
      )
      navigate({ to: '/admin/surveys/$id', params: { id: survey.id } })
    },
    onError: () => {
      toast.error('Failed to create survey')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!title.trim()) {
      setErrors({ title: 'Title is required' })
      return
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      templateId: selectedTemplateId,
    })
  }

  const handleContinue = () => {
    const defaultTitle = selectedTemplateId !== 'blank' && selectedTemplate
      ? selectedTemplate.defaultTitle
      : ''
    const defaultDescription = selectedTemplateId !== 'blank' && selectedTemplate
      ? selectedTemplate.defaultDescription
      : ''

    if (!title.trim() && defaultTitle) {
      setTitle(defaultTitle)
    }

    if (!description.trim() && defaultDescription) {
      setDescription(defaultDescription)
    }

    setStep('details')
  }

  return (
    <div className="max-w-2xl relative">
      {/* Background decorations */}
      <div className="absolute -inset-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-cyan/10 rounded-full blur-3xl" />
      </div>

      {/* Back link */}
      <Link 
        to="/admin/surveys" 
        className="inline-flex items-center text-gray-400 hover:text-neon-cyan mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
        Back to Surveys
      </Link>

      {/* Header */}
      <div className="mb-8 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-neon-pink to-neon-orange">
            <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold text-gradient">Create New Survey</h1>
        </div>
        <p className="text-gray-400">Beginner flow: pick a template, then personalize details</p>
        <div className="mt-4 flex items-center gap-3 text-xs">
          <span className={`px-2 py-1 border ${step === 'template' ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : 'border-white/20 text-white/50'}`}>
            1. Template
          </span>
          <span className={`px-2 py-1 border ${step === 'details' ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : 'border-white/20 text-white/50'}`}>
            2. Details
          </span>
        </div>
      </div>

      {step === 'template' ? (
        <Card variant="gradient">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
              Choose a Starting Point
            </CardTitle>
            <CardDescription className="text-gray-400">
              Pick a ready template or start blank. You can customize everything later.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {SURVEY_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`text-left border-2 p-4 transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-white/15 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex items-center gap-2">
                      <template.icon className="h-4 w-4 text-neon-cyan" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-white">{template.name}</h3>
                    </div>
                    {selectedTemplateId === template.id && (
                      <CheckCircle2 className="h-4 w-4 text-neon-lime" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-2">{template.description}</p>
                  <p className="text-[11px] text-neon-violet mt-2">{template.questions.length} starter questions</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/admin/surveys' })}
              >
                Cancel
              </Button>
              <Button type="button" variant="gradient" onClick={handleContinue}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card variant="gradient">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
              Survey Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Keep this simple. You can edit settings and questions right after creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor={titleId} required className="text-white">
                  Title
                </Label>
                <Input
                  id={titleId}
                  placeholder="e.g., Customer Feedback Survey"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={!!errors.title}
                  aria-describedby={errors.title ? titleErrorId : undefined}
                  className="text-lg"
                />
                {errors.title && (
                  <p id={titleErrorId} className="text-sm text-neon-pink" role="alert">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={descriptionId} className="text-white">
                  Description
                </Label>
                <Textarea
                  id={descriptionId}
                  placeholder="What is this survey about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="border border-white/15 bg-white/5 p-3 text-sm text-white/70">
                Starting template: <span className="text-neon-cyan font-semibold">{selectedTemplate?.name ?? 'Blank'}</span>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep('template')}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  disabled={createMutation.isPending}
                  className="group"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" aria-hidden="true" />
                      Create Survey
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const SURVEY_TEMPLATES: Array<{
  id: string
  name: string
  description: string
  icon: typeof UserRound
  defaultTitle: string
  defaultDescription: string
  questions: CreateQuestionRequest[]
}> = [
  {
    id: 'blank',
    name: 'Start from Scratch',
    description: 'Empty survey for complete control.',
    icon: Sparkles,
    defaultTitle: '',
    defaultDescription: '',
    questions: [],
  },
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Measure satisfaction and find improvements.',
    icon: UserRound,
    defaultTitle: 'Customer Feedback Survey',
    defaultDescription: 'Help us improve your experience with short feedback.',
    questions: [
      {
        type: 'rating',
        title: 'How satisfied are you with your overall experience?',
        required: true,
        config: { scale: { min: 1, max: 5, labels: { '1': 'Very dissatisfied', '5': 'Very satisfied' } } },
      },
      {
        type: 'radio',
        title: 'How likely are you to recommend us to others?',
        required: true,
        config: {
          options: [
            { id: 'nps-1', label: 'Not likely', value: 'not_likely' },
            { id: 'nps-2', label: 'Maybe', value: 'maybe' },
            { id: 'nps-3', label: 'Very likely', value: 'very_likely' },
          ],
        },
      },
      {
        type: 'textarea',
        title: 'What can we improve?',
        required: false,
      },
    ],
  },
  {
    id: 'employee-engagement',
    name: 'Employee Engagement',
    description: 'Collect internal team sentiment and blockers.',
    icon: Briefcase,
    defaultTitle: 'Employee Engagement Pulse',
    defaultDescription: 'A quick pulse to improve team health and performance.',
    questions: [
      {
        type: 'rating',
        title: 'How motivated do you feel at work this week?',
        required: true,
        config: { scale: { min: 1, max: 10 } },
      },
      {
        type: 'checkbox',
        title: 'Which areas need attention?',
        required: false,
        config: {
          options: [
            { id: 'eng-1', label: 'Workload balance', value: 'workload' },
            { id: 'eng-2', label: 'Communication', value: 'communication' },
            { id: 'eng-3', label: 'Tools and process', value: 'tools' },
            { id: 'eng-4', label: 'Growth opportunities', value: 'growth' },
          ],
        },
      },
      {
        type: 'textarea',
        title: 'Any suggestions for leadership?',
        required: false,
      },
    ],
  },
  {
    id: 'course-evaluation',
    name: 'Course Evaluation',
    description: 'Ideal for education and training feedback.',
    icon: GraduationCap,
    defaultTitle: 'Course Evaluation Survey',
    defaultDescription: 'Share feedback to help improve this course.',
    questions: [
      {
        type: 'rating',
        title: 'How would you rate this course overall?',
        required: true,
        config: { scale: { min: 1, max: 5 } },
      },
      {
        type: 'select',
        title: 'Which module was most valuable?',
        required: true,
        config: {
          options: [
            { id: 'mod-1', label: 'Module 1', value: 'module_1' },
            { id: 'mod-2', label: 'Module 2', value: 'module_2' },
            { id: 'mod-3', label: 'Module 3', value: 'module_3' },
          ],
        },
      },
      {
        type: 'textarea',
        title: 'What should we improve for future learners?',
        required: false,
      },
    ],
  },
]

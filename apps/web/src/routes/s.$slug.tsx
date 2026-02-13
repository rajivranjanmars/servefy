import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useCallback, useId, useMemo, memo } from 'react'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Checkbox } from '../components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Progress } from '../components/ui/progress'
import { Skeleton } from '../components/ui/skeleton'
import { Switch } from '../components/ui/switch'
import { cn } from '../lib/utils'
import { CheckCircle2, AlertCircle, Clock, FileQuestion } from 'lucide-react'
import type { Survey, Question, SubmitResponseRequest } from '@survey/types'

export const Route = createFileRoute('/s/$slug')({
  component: SurveyPage,
})

function SurveyPage() {
  const { slug } = Route.useParams()
  const formId = useId()

  const { data: survey, isLoading, error } = useQuery<Survey>({
    queryKey: ['public-survey', slug],
    queryFn: () => api.get(`/surveys/public/${slug}`).then(r => r.data.survey),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submitMutation = useMutation({
    mutationFn: (data: SubmitResponseRequest) => {
      if (!survey?.id) {
        throw new Error('Survey not loaded')
      }
      return api.post(`/responses/survey/${survey.id}/submit`, data)
    },
    onSuccess: () => {
      setSubmitted(true)
    },
  })

  const updateAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    // Clear error when user provides input
    if (errors[questionId]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }, [errors])

  const orderedQuestions = useMemo(
    () => [...(survey?.questions ?? [])].sort((a, b) => a.order - b.order),
    [survey?.questions]
  )

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(orderedQuestions, answers),
    [orderedQuestions, answers]
  )

  const progress = useMemo(() => {
    if (visibleQuestions.length === 0) return 0
    const answered = visibleQuestions.filter((question) => {
      const value = answers[question.id]
      return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
    }).length
    return (answered / visibleQuestions.length) * 100
  }, [visibleQuestions, answers])

  const validateAnswers = useCallback(() => {
    if (orderedQuestions.length === 0) return true

    const newErrors: Record<string, string> = {}

    for (const question of visibleQuestions) {
      if (question.required) {
        const answer = answers[question.id]
        if (answer === undefined || answer === null || answer === '' ||
            (Array.isArray(answer) && answer.length === 0)) {
          newErrors[question.id] = 'This field is required'
        }
      }

      // Type-specific validation
      const answer = answers[question.id]
      if (answer !== undefined && answer !== null && answer !== '') {
        if (question.type === 'email' && typeof answer === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
            newErrors[question.id] = 'Please enter a valid email address'
          }
        }
        if (question.type === 'url' && typeof answer === 'string') {
          try {
            new URL(answer)
          } catch {
            newErrors[question.id] = 'Please enter a valid URL'
          }
        }
        if (question.type === 'number' && typeof answer === 'string') {
          const num = parseFloat(answer)
          if (isNaN(num)) {
            newErrors[question.id] = 'Please enter a valid number'
          } else {
            if (question.config.min !== undefined && num < question.config.min) {
              newErrors[question.id] = `Value must be at least ${question.config.min}`
            }
            if (question.config.max !== undefined && num > question.config.max) {
              newErrors[question.id] = `Value must be at most ${question.config.max}`
            }
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [orderedQuestions.length, visibleQuestions, answers])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAnswers()) {
      return
    }

    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }))

    submitMutation.mutate({ answers: formattedAnswers })
  }, [answers, validateAnswers, submitMutation])

  if (isLoading) {
    return <SurveyLoadingSkeleton />
  }

  if (error) {
    return (
      <SurveyStatusPage
        icon={<FileQuestion className="h-10 w-10 text-neon-orange" />}
        iconBg="bg-neon-orange/20"
        title="Survey Not Found"
        description="This survey may have been removed or the link may be incorrect."
        accentColor="neon-orange"
      />
    )
  }

  if (!survey) {
    return null
  }

  if (survey.status === 'closed') {
    return (
      <SurveyStatusPage
        icon={<Clock className="h-10 w-10 text-neon-violet" />}
        iconBg="bg-neon-violet/20"
        title="Survey Closed"
        description="This survey is no longer accepting responses."
        accentColor="neon-violet"
      />
    )
  }

  if (survey.status === 'draft') {
    return (
      <SurveyStatusPage
        icon={<AlertCircle className="h-10 w-10 text-neon-cyan" />}
        iconBg="bg-neon-cyan/20"
        title="Survey Not Available"
        description="This survey is not yet published."
        accentColor="neon-cyan"
      />
    )
  }

  if (submitted) {
    return (
      <SurveyStatusPage
        icon={<CheckCircle2 className="h-10 w-10 text-neon-lime" />}
        iconBg="bg-neon-lime/20"
        title="Thank You!"
        description={survey.settings?.confirmationMessage || 'Your response has been recorded.'}
        accentColor="neon-lime"
        redirectUrl={survey.settings?.redirectUrl}
      />
    )
  }

  return (
    <div className="min-h-screen bg-deep-black py-8 px-4 relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-neon-pink/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-neon-cyan/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Survey Header */}
        <header className="border-2 border-white/20 bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-brutal-pink mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-sm sm:text-base text-white/60">{survey.description}</p>
          )}
        </header>

        {/* Progress Bar */}
        {survey.settings?.showProgressBar && (
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">Progress</span>
              <span className="text-neon-cyan font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}

        {/* Survey Form */}
        <form onSubmit={handleSubmit} id={formId} className="pb-28 sm:pb-0">
          <div className="space-y-6">
            {visibleQuestions.map((question, index) => (
              <MemoQuestionCard
                key={question.id}
                question={question}
                index={index}
                value={answers[question.id]}
                error={errors[question.id]}
                onChange={(value) => updateAnswer(question.id, value)}
              />
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 sm:mt-10 sm:static fixed bottom-0 inset-x-0 p-4 bg-deep-black/95 backdrop-blur-md border-t border-white/10 sm:bg-transparent sm:border-0 sm:p-0 z-20">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Response'}
            </Button>
            {submitMutation.isError && (
              <p className="mt-3 text-sm text-neon-pink font-medium" role="alert">
                Failed to submit response. Please try again.
              </p>
            )}
          </div>
        </form>

        {/* Footer branding */}
        <div className="mt-12 text-center">
          <p className="text-white/30 text-sm">
            Powered by <span className="text-neon-pink font-bold">Servefy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Status page component for error/success states
interface SurveyStatusPageProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  accentColor: string
  redirectUrl?: string
}

function SurveyStatusPage({ icon, iconBg, title, description, accentColor, redirectUrl }: SurveyStatusPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-black p-4 relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-${accentColor}/20 rounded-full blur-[100px]`} />
      </div>

      <div className="border-2 border-white/20 bg-white/5 backdrop-blur-sm p-8 shadow-brutal-cyan max-w-md w-full text-center relative z-10">
        <div className={`w-20 h-20 mx-auto mb-6 ${iconBg} border-2 border-white/20 flex items-center justify-center`}>
          {icon}
        </div>
        <h1 className="text-2xl font-black text-white mb-4">{title}</h1>
        <p className="text-white/60">
          {description}
        </p>
        {redirectUrl && (
          <a
            href={redirectUrl}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-neon-lime text-deep-black font-bold border-2 border-neon-lime hover:bg-neon-lime/90 transition-colors"
          >
            Continue
          </a>
        )}
      </div>
    </div>
  )
}

// Helper to evaluate conditional logic
function getVisibleQuestions(questions: Question[], answers: Record<string, unknown>): Question[] {
  return questions.filter(question => {
      if (!question.conditionalLogic?.enabled) return true

      const { conditions, logic, action } = question.conditionalLogic
      const results = conditions.map(condition => {
        const answer = answers[condition.questionId]
        return evaluateCondition(condition, answer)
      })

      const matches = logic === 'and'
        ? results.every(Boolean)
        : results.some(Boolean)

      return action === 'show' ? matches : !matches
    })
}

function evaluateCondition(
  condition: { operator: string; value?: unknown },
  answer: unknown
): boolean {
  const { operator, value } = condition

  switch (operator) {
    case 'equals':
      return answer === value
    case 'not_equals':
      return answer !== value
    case 'contains':
      if (Array.isArray(answer)) return answer.includes(value)
      if (typeof answer === 'string') return answer.includes(String(value))
      return false
    case 'not_contains':
      if (Array.isArray(answer)) return !answer.includes(value)
      if (typeof answer === 'string') return !answer.includes(String(value))
      return true
    case 'greater_than':
      return Number(answer) > Number(value)
    case 'less_than':
      return Number(answer) < Number(value)
    case 'is_empty':
      return answer === undefined || answer === null || answer === '' ||
        (Array.isArray(answer) && answer.length === 0)
    case 'is_not_empty':
      return answer !== undefined && answer !== null && answer !== '' &&
        !(Array.isArray(answer) && answer.length === 0)
    default:
      return true
  }
}

interface QuestionCardProps {
  question: Question
  index: number
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}

// Color rotation for question numbers
const questionColors = [
  { bg: 'bg-neon-pink', text: 'text-white', shadow: 'shadow-brutal-pink' },
  { bg: 'bg-neon-cyan', text: 'text-deep-black', shadow: 'shadow-brutal-cyan' },
  { bg: 'bg-neon-lime', text: 'text-deep-black', shadow: 'shadow-brutal-lime' },
  { bg: 'bg-neon-violet', text: 'text-white', shadow: 'shadow-brutal-violet' },
]

function QuestionCard({ question, index, value, error, onChange }: QuestionCardProps) {
  const inputId = useId()
  const errorId = useId()
  const colorIndex = index % questionColors.length
  const color = questionColors[colorIndex]!

  return (
    <article
      className={cn(
        'border-2 border-white/20 bg-white/5 backdrop-blur-sm p-4 sm:p-6 transition-all [content-visibility:auto]',
        'hover:border-white/30 focus-within:border-neon-cyan/50',
        error ? 'border-neon-pink/50' : ''
      )}
    >
      <div className="mb-4">
        <Label htmlFor={inputId} className="text-sm sm:text-base font-medium text-white flex items-start gap-3">
          <span className={cn(
            'w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm font-black',
            color.bg, color.text
          )}>
            {index + 1}
          </span>
          <span className="pt-1">
            {question.title}
            {question.required && (
              <>
                <span className="text-neon-pink ml-1" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </>
            )}
          </span>
        </Label>
        {question.description && (
          <p className="text-sm text-white/50 mt-2 ml-0 sm:ml-11">{question.description}</p>
        )}
      </div>

      <div className="ml-0 sm:ml-11">
        <QuestionInput
          question={question}
          inputId={inputId}
          errorId={errorId}
          value={value}
          error={error}
          onChange={onChange}
        />

        {error && (
          <p id={errorId} className="mt-2 text-sm text-neon-pink font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}

const MemoQuestionCard = memo(QuestionCard)

interface QuestionInputProps {
  question: Question
  inputId: string
  errorId: string
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}

function QuestionInput({ question, inputId, errorId, value, error, onChange }: QuestionInputProps) {
  const { type, config } = question

  switch (type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <Input
          id={inputId}
          type={type === 'phone' ? 'tel' : type}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          required={question.required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      )

    case 'number':
      return (
        <Input
          id={inputId}
          type="number"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          min={config.min}
          max={config.max}
          required={question.required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      )

    case 'textarea':
      return (
        <Textarea
          id={inputId}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          minLength={config.minLength}
          maxLength={config.maxLength}
          required={question.required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          rows={4}
        />
      )

    case 'select':
      return (
        <Select
          value={(value as string) || ''}
          onValueChange={onChange}
          required={question.required}
        >
          <SelectTrigger
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            <SelectValue placeholder={config.placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {config.options?.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'radio':
      return (
        <RadioGroup
          value={(value as string) || ''}
          onValueChange={onChange}
          aria-labelledby={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="space-y-2"
        >
          {config.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-3">
              <RadioGroupItem value={option.value} id={`${inputId}-${option.id}`} />
              <Label htmlFor={`${inputId}-${option.id}`} className="font-normal cursor-pointer text-white/80">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    case 'checkbox':
    case 'multiselect':
      return (
        <div
          role="group"
          aria-labelledby={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="space-y-2"
        >
          {config.options?.map((option) => {
            const checked = Array.isArray(value) && value.includes(option.value)
            return (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`${inputId}-${option.id}`}
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    const current = Array.isArray(value) ? value : []
                    if (isChecked) {
                      onChange([...current, option.value])
                    } else {
                      onChange(current.filter((v) => v !== option.value))
                    }
                  }}
                />
                <Label htmlFor={`${inputId}-${option.id}`} className="font-normal cursor-pointer text-white/80">
                  {option.label}
                </Label>
              </div>
            )
          })}
        </div>
      )

    case 'yesno':
      return (
        <div className="flex items-center space-x-4">
          <Switch
            id={inputId}
            checked={value === true || value === 'yes'}
            onCheckedChange={(checked) => onChange(checked ? 'yes' : 'no')}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Label htmlFor={inputId} className="font-normal text-white/80">
            {value === true || value === 'yes' ? 'Yes' : 'No'}
          </Label>
        </div>
      )

    case 'rating':
      const scale = config.scale || { min: 1, max: 5 }
      const ratingValue = typeof value === 'number' ? value : 0
      return (
        <div
          role="radiogroup"
          aria-labelledby={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="flex flex-wrap items-center gap-2"
        >
          {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i).map((num) => (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={ratingValue === num}
              onClick={() => onChange(num)}
              className={cn(
                'w-12 h-12 border-2 font-bold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-deep-black',
                ratingValue === num
                  ? 'bg-neon-cyan text-deep-black border-neon-cyan'
                  : 'bg-white/5 text-white/70 border-white/20 hover:border-neon-cyan/50 hover:text-white'
              )}
            >
              {num}
            </button>
          ))}
          {scale.labels && (
            <div className="ml-4 text-sm text-white/50">
              {scale.labels[String(ratingValue)] || ''}
            </div>
          )}
        </div>
      )

    case 'slider':
      const sliderMin = config.min ?? 0
      const sliderMax = config.max ?? 100
      const sliderValue = typeof value === 'number' ? value : sliderMin
      return (
        <div className="space-y-3">
          <input
            id={inputId}
            type="range"
            min={sliderMin}
            max={sliderMax}
            value={sliderValue}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-none appearance-none cursor-pointer accent-neon-cyan"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{sliderMin}</span>
            <span className="font-bold text-neon-cyan">{sliderValue}</span>
            <span className="text-white/50">{sliderMax}</span>
          </div>
        </div>
      )

    case 'date':
      return (
        <Input
          id={inputId}
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      )

    case 'datetime':
      return (
        <Input
          id={inputId}
          type="datetime-local"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      )

    default:
      return (
        <Input
          id={inputId}
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          required={question.required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      )
  }
}

function SurveyLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-deep-black py-8 px-4 relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-neon-pink/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-neon-cyan/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header skeleton */}
        <div className="border-2 border-white/20 bg-white/5 backdrop-blur-sm p-6 shadow-brutal-pink mb-6">
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </div>

        {/* Progress skeleton */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>

        {/* Question skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-2 border-white/20 bg-white/5 backdrop-blur-sm p-6 mb-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <Skeleton className="h-8 w-8 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
            </div>
            <div className="ml-11">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}

        {/* Button skeleton */}
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

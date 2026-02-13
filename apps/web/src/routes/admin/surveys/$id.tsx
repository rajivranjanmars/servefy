import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useId } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical, Save, ExternalLink, Copy, BarChart3, ArrowLeft, Rocket, Settings, Zap, AlertTriangle, GitBranch, X } from 'lucide-react'
import type { Survey, Question, QuestionType, CreateQuestionRequest, UpdateQuestionRequest, ConditionalLogic, Condition } from '@survey/types'

export const Route = createFileRoute('/admin/surveys/$id')({
  component: SurveyDetailPage,
})

function SurveyDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const response = await api.get<{ survey: Survey }>(`/surveys/${id}`)
      return response.data.survey
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Survey>) => {
      const response = await api.patch<{ survey: Survey }>(`/surveys/${id}`, data)
      return response.data.survey
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] })
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey updated')
    },
    onError: () => {
      toast.error('Failed to update survey')
    },
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ survey: Survey }>(`/surveys/${id}/publish`)
      return response.data.survey
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] })
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey published!')
    },
    onError: () => {
      toast.error('Failed to publish survey')
    },
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ survey: Survey }>(`/surveys/${id}/close`)
      return response.data.survey
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] })
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey closed')
    },
    onError: () => {
      toast.error('Failed to close survey')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/surveys/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('Survey deleted')
      navigate({ to: '/admin/surveys' })
    },
    onError: () => {
      toast.error('Failed to delete survey')
    },
  })

  const copyLink = () => {
    const url = `${window.location.origin}/s/${survey?.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
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
            <p className="text-gray-400 mb-6">The survey you&apos;re looking for doesn&apos;t exist.</p>
            <Link to="/admin/surveys">
              <Button variant="cyan">Back to Surveys</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative">
      {/* Background decorations */}
      <div className="absolute -inset-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-violet/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 relative">
        <div>
          <Link 
            to="/admin/surveys" 
            className="inline-flex items-center text-gray-400 hover:text-neon-cyan mb-4 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            Back to Surveys
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{survey.title}</h1>
          <p className="text-gray-400 mt-1">{survey.description || 'No description'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {survey.status === 'published' && (
            <>
              <Button variant="outline" onClick={copyLink} className="group">
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                Copy Link
              </Button>
              <a
                href={`/s/${survey.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                  Preview
                </Button>
              </a>
            </>
          )}
          <Link to="/admin/surveys/$id/responses" params={{ id }}>
            <Button variant="violet">
              <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
              Responses ({survey.responseCount})
            </Button>
          </Link>
          {survey.status === 'draft' && (
            <Button variant="gradient" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Rocket className="h-4 w-4 mr-2" aria-hidden="true" />
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {survey.status === 'published' && (
            <Button variant="outline" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              {closeMutation.isPending ? 'Closing...' : 'Close Survey'}
            </Button>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={`px-4 py-2 text-sm font-bold border-2 inline-flex items-center gap-2 ${
          survey.status === 'published'
            ? 'bg-neon-lime/20 text-neon-lime border-neon-lime'
            : survey.status === 'draft'
            ? 'bg-neon-orange/20 text-neon-orange border-neon-orange'
            : 'bg-gray-500/20 text-gray-400 border-gray-500'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${
          survey.status === 'published' ? 'bg-neon-lime animate-pulse' :
          survey.status === 'draft' ? 'bg-neon-orange' : 'bg-gray-500'
        }`} />
        {survey.status.toUpperCase()}
      </span>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6">
          <QuestionsEditor surveyId={id} questions={survey.questions || []} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SurveySettings
            survey={survey}
            onSave={(data) => updateMutation.mutate(data)}
            onDelete={() => deleteMutation.mutate()}
            isSaving={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QuestionsEditor({
  surveyId,
  questions,
}: {
  surveyId: string
  questions: Question[]
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [logicEditorQuestionId, setLogicEditorQuestionId] = useState<string | null>(null)

  const addMutation = useMutation({
    mutationFn: async (data: CreateQuestionRequest) => {
      const response = await api.post<{ question: Question }>(`/questions/survey/${surveyId}`, data)
      return response.data.question
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] })
      setIsAdding(false)
      toast.success('Question added')
    },
    onError: () => {
      toast.error('Failed to add question')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await api.delete(`/questions/${questionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] })
      toast.success('Question deleted')
    },
    onError: () => {
      toast.error('Failed to delete question')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: string; data: UpdateQuestionRequest }) => {
      const response = await api.patch<{ question: Question }>(`/questions/${questionId}`, data)
      return response.data.question
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] })
      toast.success('Question logic updated')
    },
    onError: () => {
      toast.error('Failed to update question logic')
    },
  })

  return (
    <div className="space-y-4">
      {questions.length > 0 ? (
        questions.map((question, index) => (
          <Card key={question.id} variant="glass" className="group hover:border-neon-cyan/30 transition-colors">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="cursor-move text-gray-500 hover:text-neon-cyan transition-colors" aria-hidden="true">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`
                    w-8 h-8 flex items-center justify-center text-sm font-bold
                    ${index % 4 === 0 ? 'bg-neon-pink text-white' : ''}
                    ${index % 4 === 1 ? 'bg-neon-cyan text-deep-black' : ''}
                    ${index % 4 === 2 ? 'bg-neon-lime text-deep-black' : ''}
                    ${index % 4 === 3 ? 'bg-neon-violet text-white' : ''}
                  `}>
                    {index + 1}
                  </span>
                  <span className="text-xs px-2 py-1 bg-white/10 text-gray-400 border border-white/10">
                    {question.type}
                  </span>
                  {question.required && (
                    <span className="text-xs text-neon-pink font-medium">Required</span>
                  )}
                  {question.conditionalLogic?.enabled && (
                    <span className="text-xs px-2 py-1 bg-neon-violet/20 text-neon-violet border border-neon-violet/30 inline-flex items-center gap-1">
                      <GitBranch className="h-3 w-3" aria-hidden="true" />
                      Logic
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg text-white">{question.title}</CardTitle>
                {question.description && (
                  <CardDescription className="text-gray-400">{question.description}</CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-neon-violet hover:text-neon-cyan hover:bg-white/10"
                onClick={() => setLogicEditorQuestionId((prev) => (prev === question.id ? null : question.id))}
              >
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Configure logic for question</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Delete question</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this question? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(question.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>

            {logicEditorQuestionId === question.id && (
              <CardContent className="pt-0">
                <ConditionalLogicEditor
                  question={question}
                  questions={questions}
                  isSaving={updateMutation.isPending}
                  onCancel={() => setLogicEditorQuestionId(null)}
                  onSave={(conditionalLogic) => {
                    updateMutation.mutate({
                      questionId: question.id,
                      data: { conditionalLogic },
                    })
                    setLogicEditorQuestionId(null)
                  }}
                />
              </CardContent>
            )}
          </Card>
        ))
      ) : (
        <Card variant="glass">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-neon-cyan/20 flex items-center justify-center">
              <Plus className="h-6 w-6 text-neon-cyan" aria-hidden="true" />
            </div>
            <p className="text-gray-400 mb-4">No questions yet. Add your first question below.</p>
          </CardContent>
        </Card>
      )}

      {isAdding ? (
        <AddQuestionForm
          onSubmit={(data) => addMutation.mutate(data)}
          onCancel={() => setIsAdding(false)}
          isLoading={addMutation.isPending}
        />
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full group">
          <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" aria-hidden="true" />
          Add Question
        </Button>
      )}
    </div>
  )
}

const OPERATOR_OPTIONS: Array<{ value: Condition['operator']; label: string; needsValue: boolean }> = [
  { value: 'equals', label: 'Equals', needsValue: true },
  { value: 'not_equals', label: 'Does not equal', needsValue: true },
  { value: 'contains', label: 'Contains', needsValue: true },
  { value: 'not_contains', label: 'Does not contain', needsValue: true },
  { value: 'greater_than', label: 'Greater than', needsValue: true },
  { value: 'less_than', label: 'Less than', needsValue: true },
  { value: 'is_empty', label: 'Is empty', needsValue: false },
  { value: 'is_not_empty', label: 'Is not empty', needsValue: false },
]

function ConditionalLogicEditor({
  question,
  questions,
  onSave,
  onCancel,
  isSaving,
}: {
  question: Question
  questions: Question[]
  onSave: (logic: ConditionalLogic) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const defaultLogic: ConditionalLogic = question.conditionalLogic ?? {
    enabled: false,
    conditions: [],
    logic: 'and',
    action: 'show',
  }

  const [enabled, setEnabled] = useState(defaultLogic.enabled)
  const [logic, setLogic] = useState<'and' | 'or'>(defaultLogic.logic)
  const [action, setAction] = useState<'show' | 'hide'>(defaultLogic.action)
  const [conditions, setConditions] = useState<Condition[]>(
    defaultLogic.conditions.length > 0
      ? defaultLogic.conditions
      : [{ questionId: '', operator: 'equals', value: '' }]
  )

  const availableQuestions = questions
    .filter((candidate) => candidate.id !== question.id && candidate.order < question.order)
    .sort((a, b) => a.order - b.order)

  const handleSave = () => {
    if (!enabled) {
      onSave({ enabled: false, conditions: [], logic, action })
      return
    }

    if (conditions.length === 0) {
      toast.error('Add at least one condition')
      return
    }

    for (const condition of conditions) {
      if (!condition.questionId) {
        toast.error('Choose a source question for each condition')
        return
      }

      const operator = OPERATOR_OPTIONS.find((option) => option.value === condition.operator)
      if (operator?.needsValue && (condition.value === undefined || condition.value === '')) {
        toast.error('Enter a value for all conditions')
        return
      }
    }

    onSave({ enabled: true, conditions, logic, action })
  }

  const addCondition = () => {
    setConditions((prev) => [...prev, { questionId: '', operator: 'equals', value: '' }])
  }

  const updateCondition = (index: number, patch: Partial<Condition>) => {
    setConditions((prev) => prev.map((condition, i) => (i === index ? { ...condition, ...patch } : condition)))
  }

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="mt-2 border border-neon-violet/30 bg-neon-violet/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white inline-flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-neon-violet" aria-hidden="true" />
          Logic Rules
        </h4>
        <Switch
          id={`logic-enabled-${question.id}`}
          checked={enabled}
          onCheckedChange={setEnabled}
          label="Enable"
        />
      </div>

      {!enabled ? (
        <p className="text-sm text-gray-400">This question always appears. Enable logic to create branching rules.</p>
      ) : (
        <>
          {availableQuestions.length === 0 ? (
            <p className="text-sm text-neon-orange">Add earlier questions first. Logic can only reference previous questions.</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-white">When conditions match</Label>
                  <Select value={action} onValueChange={(value) => setAction(value as 'show' | 'hide')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="show">Show this question</SelectItem>
                      <SelectItem value="hide">Hide this question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Match mode</Label>
                  <Select value={logic} onValueChange={(value) => setLogic(value as 'and' | 'or')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="and">All conditions (AND)</SelectItem>
                      <SelectItem value="or">Any condition (OR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {conditions.map((condition, index) => {
                  const sourceQuestion = availableQuestions.find((q) => q.id === condition.questionId)
                  const selectedOperator = OPERATOR_OPTIONS.find((option) => option.value === condition.operator)
                  const showValueInput = Boolean(selectedOperator?.needsValue)

                  return (
                    <div key={`${question.id}-condition-${index}`} className="border border-white/15 bg-white/5 p-3 space-y-3">
                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-white">Question</Label>
                          <Select value={condition.questionId} onValueChange={(value) => updateCondition(index, { questionId: value, value: '' })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select question" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableQuestions.map((candidate) => (
                                <SelectItem key={candidate.id} value={candidate.id}>
                                  Q{candidate.order}: {candidate.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Operator</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => {
                              const op = value as Condition['operator']
                              const needsValue = OPERATOR_OPTIONS.find((option) => option.value === op)?.needsValue
                              updateCondition(index, { operator: op, value: needsValue ? '' : undefined })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATOR_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Value</Label>
                          {showValueInput ? (
                            <ConditionValueInput
                              sourceQuestion={sourceQuestion}
                              value={condition.value}
                              onChange={(value) => updateCondition(index, { value })}
                            />
                          ) : (
                            <div className="h-10 border border-white/10 bg-white/5 px-3 flex items-center text-sm text-gray-400">
                              No value needed
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          disabled={conditions.length <= 1}
                        >
                          <X className="h-3 w-3 mr-1" aria-hidden="true" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button type="button" variant="outline" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Condition
              </Button>
            </>
          )}
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="violet" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Logic'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ConditionValueInput({
  sourceQuestion,
  value,
  onChange,
}: {
  sourceQuestion?: Question
  value: Condition['value']
  onChange: (value: Condition['value']) => void
}) {
  const type = sourceQuestion?.type

  if (!sourceQuestion) {
    return (
      <Input
        placeholder="Select question first"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (type === 'radio' || type === 'select' || type === 'checkbox' || type === 'multiselect') {
    const options = sourceQuestion.config.options ?? []
    return (
      <Select value={typeof value === 'string' ? value : ''} onValueChange={(next) => onChange(next)}>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (type === 'yesno') {
    return (
      <Select value={typeof value === 'string' ? value : ''} onValueChange={(next) => onChange(next)}>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (type === 'number' || type === 'rating' || type === 'slider') {
    const numericValue = typeof value === 'number' ? String(value) : ''
    return (
      <Input
        type="number"
        placeholder="Enter number"
        value={numericValue}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    )
  }

  return (
    <Input
      placeholder="Enter value"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function AddQuestionForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: CreateQuestionRequest) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [type, setType] = useState<QuestionType>('text')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [required, setRequired] = useState(false)
  const [errors, setErrors] = useState<{ title?: string }>({})

  const titleId = useId()
  const descId = useId()
  const titleErrorId = useId()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!title.trim()) {
      setErrors({ title: 'Question title is required' })
      return
    }

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      required,
    })
  }

  return (
    <Card variant="gradient">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
          Add Question
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="question-type" className="text-white">Question Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
              <SelectTrigger id="question-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Short Text</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="radio">Single Choice</SelectItem>
                <SelectItem value="checkbox">Multiple Choice</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="yesno">Yes/No</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={titleId} required className="text-white">Question</Label>
            <Input
              id={titleId}
              placeholder="Enter your question"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              aria-describedby={errors.title ? titleErrorId : undefined}
            />
            {errors.title && (
              <p id={titleErrorId} className="text-sm text-neon-pink" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={descId} className="text-white">Description (optional)</Label>
            <Textarea
              id={descId}
              placeholder="Add a description or instructions"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Switch
            id="required"
            checked={required}
            onCheckedChange={setRequired}
            label="Required question"
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="cyan" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Question'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function SurveySettings({
  survey,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  survey: Survey
  onSave: (data: Partial<Survey>) => void
  onDelete: () => void
  isSaving: boolean
  isDeleting: boolean
}) {
  const [title, setTitle] = useState(survey.title)
  const [description, setDescription] = useState(survey.description || '')

  const titleId = useId()
  const descId = useId()

  const handleSave = () => {
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card variant="glass">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
            Basic Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor={titleId} className="text-white">Title</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={descId} className="text-white">Description</Label>
            <Textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} variant="cyan" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card variant="glass" className="border-red-500/30">
        <CardHeader className="border-b border-red-500/20">
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-gray-400">
            Irreversible actions that affect your survey
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                {isDeleting ? 'Deleting...' : 'Delete Survey'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{survey.title}&rdquo;? This action cannot be undone.
                  All questions and responses will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete Survey
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

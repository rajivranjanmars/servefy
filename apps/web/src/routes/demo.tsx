import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useState, useId } from 'react'
import { Sparkles, ArrowRight, ArrowLeft, Send, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/demo')({
  component: DemoPage,
})

function DemoPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const [formData, setFormData] = useState({
    name: '',
    satisfaction: '',
    features: [] as string[],
    feedback: '',
  })

  const nameId = useId()
  const satisfactionId = useId()
  const feedbackId = useId()

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setStep(1)
      setFormData({ name: '', satisfaction: '', features: [], feedback: '' })
    }, 3000)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor={nameId} required className="text-white text-lg">
                What&apos;s your name?
              </Label>
              <Input
                id={nameId}
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg py-6"
              />
            </div>
            <div className="space-y-4">
              <Label id={satisfactionId} required className="text-white text-lg">
                How satisfied are you with our product?
              </Label>
              <RadioGroup
                aria-labelledby={satisfactionId}
                value={formData.satisfaction}
                onValueChange={(value) => setFormData(prev => ({ ...prev, satisfaction: value }))}
                className="space-y-3"
              >
                {[
                  { value: 'Very Satisfied', color: 'text-neon-lime' },
                  { value: 'Satisfied', color: 'text-neon-cyan' },
                  { value: 'Neutral', color: 'text-gray-400' },
                  { value: 'Dissatisfied', color: 'text-neon-orange' },
                  { value: 'Very Dissatisfied', color: 'text-neon-pink' },
                ].map((option) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-3 p-4 border-2 border-white/10 hover:border-neon-cyan/50 transition-colors cursor-pointer ${
                      formData.satisfaction === option.value ? 'border-neon-cyan bg-neon-cyan/10' : ''
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, satisfaction: option.value }))}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className={`font-normal cursor-pointer ${option.color}`}>
                      {option.value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-white text-lg">Which features do you use most?</Label>
              <p className="text-gray-400 text-sm">Select all that apply</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { name: 'Survey Builder', icon: '🎨' },
                  { name: 'Analytics Dashboard', icon: '📊' },
                  { name: 'Team Collaboration', icon: '👥' },
                  { name: 'Export Tools', icon: '📤' },
                  { name: 'API Access', icon: '🔌' },
                  { name: 'Custom Branding', icon: '✨' },
                ].map((feature) => (
                  <div 
                    key={feature.name} 
                    className={`flex items-center space-x-3 p-4 border-2 transition-all cursor-pointer ${
                      formData.features.includes(feature.name) 
                        ? 'border-neon-pink bg-neon-pink/10' 
                        : 'border-white/10 hover:border-neon-pink/50'
                    }`}
                    onClick={() => handleFeatureToggle(feature.name)}
                  >
                    <Checkbox
                      id={feature.name}
                      checked={formData.features.includes(feature.name)}
                      onCheckedChange={() => handleFeatureToggle(feature.name)}
                    />
                    <Label htmlFor={feature.name} className="font-normal cursor-pointer text-white flex items-center gap-2">
                      <span>{feature.icon}</span>
                      {feature.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor={feedbackId} className="text-white text-lg">
                Any additional feedback?
              </Label>
              <p className="text-gray-400 text-sm">We&apos;d love to hear your thoughts</p>
              <Textarea
                id={feedbackId}
                placeholder="Tell us what you think..."
                value={formData.feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                rows={6}
                className="text-lg"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.satisfaction
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card variant="gradient" className="max-w-md w-full text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-neon-lime to-neon-cyan flex items-center justify-center animate-pulse">
              <CheckCircle className="h-10 w-10 text-deep-black" />
            </div>
            <h2 className="text-3xl font-bold text-gradient">Thank You!</h2>
            <p className="text-gray-400">Your response has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-pink/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-violet/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-pink/20 border border-neon-pink/30 text-neon-pink text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Interactive Demo
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient">
            Experience Servefy
          </h1>
          <p className="text-gray-400 text-lg">See what your respondents will experience</p>
        </div>

        {/* Survey Card */}
        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-neon-pink to-neon-violet flex items-center justify-center">
                  <span className="text-white font-bold">{step}</span>
                </div>
                <CardTitle className="text-xl">Customer Feedback</CardTitle>
              </div>
              <span className="text-sm text-neon-cyan font-medium">
                Step {step} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} label="Progress" className="mb-2" />
            <CardDescription className="text-gray-400">
              Help us improve by sharing your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="survey-card focus-within:ring-2 focus-within:ring-neon-cyan focus-within:ring-offset-2 focus-within:ring-offset-deep-black p-4 -m-4">
              {renderStep()}
            </div>

            <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setStep(prev => prev - 1)}
                disabled={step === 1}
                className="group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                Previous
              </Button>
              {step === totalSteps ? (
                <Button
                  variant="gradient"
                  onClick={handleSubmit}
                  className="group"
                >
                  Submit
                  <Send className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="cyan"
                  onClick={() => setStep(prev => prev + 1)}
                  disabled={!isStepValid()}
                  className="group"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card variant="gradient" className="inline-block">
            <CardContent className="py-8 px-12">
              <p className="text-white text-lg mb-4">
                Like what you see?
              </p>
              <Link to="/register">
                <Button variant="lime" size="lg" className="group">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

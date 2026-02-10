import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Upload, 
  Link, 
  Video, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Badge from '../components/Badge'
import ProgressBar from '../components/ProgressBar'
import api from '../utils/api'
import toast from 'react-hot-toast'

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  problemStatement: z.string().min(100, 'Problem statement must be at least 100 characters'),
  solution: z.string().min(100, 'Solution must be at least 100 characters'),
  tags: z.array(z.string()).min(1, 'Select at least one tag'),
  techStack: z.array(z.string()).min(1, 'Select at least one technology'),
  repoUrl: z.string().url('Must be a valid URL'),
  demoUrl: z.string().url('Must be a valid URL').optional(),
  videoUrl: z.string().url('Must be a valid URL'),
  teamMembers: z.array(z.object({
    email: z.string().email('Invalid email'),
    role: z.string().min(2, 'Role is required'),
  })),
})

type ProjectFormData = z.infer<typeof projectSchema>

const availableTags = [
  'Web Development', 'Mobile', 'AI/ML', 'Blockchain', 'IoT',
  'AR/VR', 'DevOps', 'Security', 'Game Dev', 'Open Source'
]

const availableTech = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Next.js',
  'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Firebase',
  'TensorFlow', 'Solidity', 'Flutter', 'React Native'
]

export default function SubmitProjectPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [teamMembers, setTeamMembers] = useState([{ email: '', role: '' }])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      tags: [],
      techStack: [],
      teamMembers: [{ email: user?.email || '', role: 'Team Lead' }],
    },
  })

  const selectedTags = watch('tags')
  const selectedTech = watch('techStack')

  const toggleTag = (tag: string) => {
    const currentTags = selectedTags || []
    if (currentTags.includes(tag)) {
      setValue('tags', currentTags.filter(t => t !== tag))
    } else {
      setValue('tags', [...currentTags, tag])
    }
  }

  const toggleTech = (tech: string) => {
    const currentTech = selectedTech || []
    if (currentTech.includes(tech)) {
      setValue('techStack', currentTech.filter(t => t !== tech))
    } else {
      setValue('techStack', [...currentTech, tech])
    }
  }

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { email: '', role: '' }])
  }

  const removeTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      const updated = [...teamMembers]
      updated.splice(index, 1)
      setTeamMembers(updated)
      setValue('teamMembers', updated)
    }
  }

  const updateTeamMember = (index: number, field: 'email' | 'role', value: string) => {
    const updated = [...teamMembers]
    updated[index][field] = value
    setTeamMembers(updated)
    setValue('teamMembers', updated)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + screenshots.length > 5) {
      toast.error('Maximum 5 screenshots allowed')
      return
    }
    setScreenshots([...screenshots, ...files])
  }

  const removeScreenshot = (index: number) => {
    const updated = [...screenshots]
    updated.splice(index, 1)
    setScreenshots(updated)
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      
      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'teamMembers') {
          formData.append(key, JSON.stringify(value))
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value as string)
        }
      })

      // Append screenshots
      screenshots.forEach((file, index) => {
        formData.append(`screenshots`, file)
      })

      const response = await api.post('/projects/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Project submitted successfully!')
      navigate(`/projects/${response.data.projectId}`)
    } catch (error) {
      toast.error('Failed to submit project')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Project title and description' },
    { number: 2, title: 'Technical Details', description: 'Tech stack and tags' },
    { number: 3, title: 'Team & Media', description: 'Team members and assets' },
    { number: 4, title: 'Review & Submit', description: 'Final review and submission' },
  ]

  const completionPercentage = (step / steps.length) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit Your Project</h1>
        <p className="text-gray-400 mb-6">
          Complete all sections to submit your hackathon project. All fields marked with * are required.
        </p>

        <Card className="mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Completion Progress</span>
              <span className="text-sm font-medium">{completionPercentage.toFixed(0)}%</span>
            </div>
            <ProgressBar value={completionPercentage} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div
                key={s.number}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  s.number === step
                    ? 'bg-primary-500/20 border border-primary-500/30'
                    : s.number < step
                    ? 'bg-green-500/10'
                    : 'bg-dark-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s.number === step
                    ? 'bg-primary-500 text-white'
                    : s.number < step
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-700 text-gray-400'
                }`}>
                  {s.number < step ? <CheckCircle className="w-4 h-4" /> : s.number}
                </div>
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-gray-400">{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="label">Project Title *</label>
                <Input
                  {...register('title')}
                  placeholder="Enter your project title"
                  error={errors.title?.message}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Make it catchy and descriptive (5-100 characters)
                </p>
              </div>

              <div>
                <label className="label">Description *</label>
                <Textarea
                  {...register('description')}
                  placeholder="Briefly describe your project"
                  rows={4}
                  error={errors.description?.message}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Provide a clear overview of what your project does (50-500 characters)
                </p>
              </div>

              <div>
                <label className="label">Problem Statement *</label>
                <Textarea
                  {...register('problemStatement')}
                  placeholder="What problem does your project solve?"
                  rows={4}
                  error={errors.problemStatement?.message}
                />
              </div>

              <div>
                <label className="label">Solution *</label>
                <Textarea
                  {...register('solution')}
                  placeholder="How does your project solve this problem?"
                  rows={4}
                  error={errors.solution?.message}
                />
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-dark-700">
              <div></div>
              <Button onClick={() => setStep(2)}>
                Next: Technical Details
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Technical Details */}
        {step === 2 && (
          <Card>
            <h2 className="text-xl font-semibold mb-6">Technical Details</h2>
            
            <div className="space-y-8">
              {/* Tags */}
              <div>
                <label className="label">Project Tags *</label>
                <p className="text-sm text-gray-400 mb-3">
                  Select tags that best describe your project (minimum 1)
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags?.includes(tag) ? 'primary' : 'outline'}
                      onClick={() => toggleTag(tag)}
                      className="cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                {errors.tags && (
                  <p className="text-sm text-red-400 mt-2">{errors.tags.message}</p>
                )}
              </div>

              {/* Tech Stack */}
              <div>
                <label className="label">Technology Stack *</label>
                <p className="text-sm text-gray-400 mb-3">
                  Select technologies used in your project (minimum 1)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableTech.map((tech) => (
                    <Button
                      key={tech}
                      type="button"
                      variant={selectedTech?.includes(tech) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => toggleTech(tech)}
                      className="justify-start"
                    >
                      {tech}
                    </Button>
                  ))}
                </div>
                {errors.techStack && (
                  <p className="text-sm text-red-400 mt-2">{errors.techStack.message}</p>
                )}
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <div>
                  <label className="label">GitHub Repository URL *</label>
                  <Input
                    {...register('repoUrl')}
                    placeholder="https://github.com/username/project"
                    leftIcon={<Link className="w-4 h-4" />}
                    error={errors.repoUrl?.message}
                  />
                </div>

                <div>
                  <label className="label">Live Demo URL (Optional)</label>
                  <Input
                    {...register('demoUrl')}
                    placeholder="https://your-project.vercel.app"
                    leftIcon={<Link className="w-4 h-4" />}
                    error={errors.demoUrl?.message}
                  />
                </div>

                <div>
                  <label className="label">Demo Video URL *</label>
                  <Input
                    {...register('videoUrl')}
                    placeholder="https://youtube.com/watch?v=..."
                    leftIcon={<Video className="w-4 h-4" />}
                    error={errors.videoUrl?.message}
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Must be a 2-3 minute video demonstrating your project
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-dark-700">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Team & Media
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Team & Media */}
        {step === 3 && (
          <Card>
            <h2 className="text-xl font-semibold mb-6">Team & Media</h2>
            
            <div className="space-y-8">
              {/* Team Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="label">Team Members</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTeamMember}
                  >
                    Add Member
                  </Button>
                </div>

                <div className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="teammate@example.com"
                          value={member.email}
                          onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          error={errors.teamMembers?.[index]?.email?.message}
                        />
                        <Input
                          placeholder="Role (e.g., Frontend Developer)"
                          value={member.role}
                          onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                          error={errors.teamMembers?.[index]?.role?.message}
                        />
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="label">Project Screenshots</label>
                <p className="text-sm text-gray-400 mb-3">
                  Upload up to 5 screenshots of your project (PNG, JPG, max 5MB each)
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Upload Button */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div className="card h-full min-h-[120px] flex flex-col items-center justify-center gap-2 hover:border-primary-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-500" />
                      <span className="text-sm text-gray-400">Add Screenshot</span>
                    </div>
                  </label>

                  {/* Preview */}
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute top-2 right-2 p-1 bg-dark-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-dark-700">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Review & Submit
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card>
            <h2 className="text-xl font-semibold mb-6">Review & Submit</h2>
            
            <div className="space-y-8">
              {/* Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Project Summary</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Title:</dt>
                        <dd>{watch('title')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Description:</dt>
                        <dd className="text-right max-w-[200px] truncate">
                          {watch('description')}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Technical Details</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Tags:</dt>
                        <dd className="flex flex-wrap gap-1 justify-end">
                          {selectedTags?.map(tag => (
                            <Badge key={tag} variant="primary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Tech Stack:</dt>
                        <dd className="flex flex-wrap gap-1 justify-end">
                          {selectedTech?.map(tech => (
                            <Badge key={tech} variant="secondary" size="sm">
                              {tech}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-700">
                  <h4 className="font-medium mb-2">Links</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-gray-400" />
                      <a href={watch('repoUrl')} className="text-primary-400 hover:underline">
                        GitHub Repository
                      </a>
                    </div>
                    {watch('demoUrl') && (
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-gray-400" />
                        <a href={watch('demoUrl')} className="text-primary-400 hover:underline">
                          Live Demo
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-400" />
                      <a href={watch('videoUrl')} className="text-primary-400 hover:underline">
                        Demo Video
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="card bg-dark-800/50">
                <h4 className="font-semibold mb-4">Hackathon Requirements</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Functional prototype built during hackathon', checked: true },
                    { label: 'Project description explaining problem/solution', checked: true },
                    { label: 'GitHub repository with source code', checked: !!watch('repoUrl') },
                    { label: '2-3 minute demo video', checked: !!watch('videoUrl') },
                    { label: 'Screenshots or demo media', checked: screenshots.length > 0 },
                    { label: 'Clear demonstration of originality', checked: true },
                  ].map((req, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {req.checked ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className={req.checked ? 'text-gray-300' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-dark-700">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Submit Project
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserPlus, Mail, Lock, User, Github, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

const availableSkills = [
  'React', 'Node.js', 'Python', 'TypeScript', 'UI/UX Design',
  'DevOps', 'Machine Learning', 'Blockchain', 'Mobile Development',
  'Database Design', 'API Development', 'Testing', 'Cloud Computing',
  'Security', 'Project Management'
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error } = useAuthStore()
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      skills: [],
    },
  })

  const toggleSkill = (skill: string) => {
    const updatedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill]
    
    setSelectedSkills(updatedSkills)
    setValue('skills', updatedSkills)
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        ...data,
        skills: selectedSkills,
      })
      navigate('/dashboard')
    } catch (error) {
      // Error is handled by the store
    }
  }

  const removeSkill = (skill: string) => {
    const updatedSkills = selectedSkills.filter(s => s !== skill)
    setSelectedSkills(updatedSkills)
    setValue('skills', updatedSkills)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join SynapseFlow</h1>
          <p className="text-gray-400">Create your account to start building amazing projects</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <Input
                  {...register('name')}
                  placeholder="John Doe"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  disabled={isLoading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password</label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <Input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="label">Skills</label>
                <p className="text-sm text-gray-400 mb-3">
                  Select your areas of expertise (minimum 1)
                </p>
                
                {/* Selected Skills */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="primary"
                        className="flex items-center gap-1"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Skill Selection */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSkills.map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={selectedSkills.includes(skill) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => toggleSkill(skill)}
                      className="justify-start"
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
                {errors.skills && (
                  <p className="text-sm text-red-400 mt-2">{errors.skills.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                leftIcon={<UserPlus className="w-5 h-5" />}
                loading={isLoading}
                disabled={isLoading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-dark-700 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Card>

          {/* Right Column - Info */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Why Join SynapseFlow?</h3>
              <ul className="space-y-3">
                {[
                  'Connect with talented developers and designers',
                  'Find teammates with complementary skills',
                  'Access hackathon resources and templates',
                  'Get mentorship from industry experts',
                  'Showcase your projects to potential employers',
                  'Win prizes and recognition',
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                    </div>
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Quick Start with GitHub</h3>
              <Button
                variant="outline"
                fullWidth
                leftIcon={<Github className="w-5 h-5" />}
                className="mb-4"
              >
                Import from GitHub
              </Button>
              <p className="text-sm text-gray-400">
                Connect your GitHub account to automatically import your skills, 
                projects, and contributions. Save time and showcase your work instantly.
              </p>
            </Card>

            <div className="text-sm text-gray-500">
              <p>
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

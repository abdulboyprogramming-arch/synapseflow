import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Users, 
  Zap, 
  Code, 
  Rocket, 
  Clock, 
  Trophy, 
  ChevronRight,
  Github,
  Linkedin,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Countdown from '../components/Countdown'

export default function HomePage() {
  const { user } = useAuthStore()
  const hackathonEndDate = '2024-06-15T23:59:59'

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart Team Matching',
      description: 'AI-powered suggestions based on skills and project requirements',
      color: 'primary'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Rapid Development',
      description: 'Pre-configured templates and tools to accelerate your project',
      color: 'secondary'
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Real-time Collaboration',
      description: 'Built-in chat, code sharing, and project management tools',
      color: 'primary'
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Submission Assistant',
      description: 'Step-by-step guide to ensure all requirements are met',
      color: 'secondary'
    },
  ]

  const stats = [
    { label: 'Active Participants', value: '1,234+' },
    { label: 'Projects Submitted', value: '456+' },
    { label: 'Teams Formed', value: '289+' },
    { label: 'Countries', value: '42' },
  ]

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="primary" className="mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                CodeSpring Hackathon 2024
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                Build the future{' '}
                <span className="gradient-text">together</span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-8">
                SynapseFlow connects developers, designers, and innovators to create 
                groundbreaking solutions in record time. Join the ultimate hackathon 
                experience.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button size="lg" leftIcon={<Rocket />}>
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link to="/submit">
                      <Button size="lg" variant="outline">
                        Submit Project
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" leftIcon={<Zap />}>
                        Get Started Free
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button size="lg" variant="outline">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>$50,000+ in prizes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>48 hours remaining</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="card p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Hackathon Countdown</h3>
                  <Countdown endDate={hackathonEndDate} />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-500/20 rounded-lg">
                        <Trophy className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Grand Prize</h4>
                        <p className="text-sm text-gray-400">$10,000 + Mentorship</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-secondary-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Team Formation</h4>
                        <p className="text-sm text-gray-400">Find your perfect match</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-500/10 rounded-full blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-500/10 rounded-full blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="text-center">
                <div className="text-3xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Everything you need to succeed</h2>
          <p className="text-xl text-gray-400">
            Built by hackers, for hackers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full">
                <div className={`p-3 rounded-lg w-fit mb-4 ${
                  feature.color === 'primary' 
                    ? 'bg-primary-500/20' 
                    : 'bg-secondary-500/20'
                }`}>
                  <div className={
                    feature.color === 'primary'
                      ? 'text-primary-400'
                      : 'text-secondary-400'
                  }>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          
          <div className="relative z-10 text-center py-16">
            <h2 className="text-4xl font-bold mb-6">
              Ready to build something amazing?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of developers pushing the boundaries of innovation. 
              The only limit is your imagination.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {user ? (
                <Link to="/submit">
                  <Button size="lg" leftIcon={<Rocket />}>
                    Submit Your Project
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" leftIcon={<Zap />}>
                      Start Building Free
                    </Button>
                  </Link>
                  <Link to="/projects">
                    <Button size="lg" variant="outline" leftIcon={<Code />}>
                      Browse Projects
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Footer Links */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500">
          <div>
            <p>© 2024 SynapseFlow. Built for CodeSpring Hackathon.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-sm hover:text-white transition-colors">
              Terms & Conditions
            </a>
            <a href="#" className="text-sm hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

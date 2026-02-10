import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  GitPullRequest,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Tabs from '../components/Tabs'
import ProgressBar from '../components/ProgressBar'
import api from '../utils/api'

interface DashboardStats {
  projects: number
  teamMembers: number
  submissions: number
  messages: number
}

interface Activity {
  id: string
  type: 'project' | 'team' | 'submission' | 'message'
  title: string
  description: string
  time: string
  status: 'success' | 'warning' | 'error'
}

interface Project {
  id: string
  title: string
  description: string
  progress: number
  status: 'active' | 'completed' | 'behind'
  teamSize: number
  deadline: string
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch dashboard data
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data
    },
  })

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['dashboard-activities'],
    queryFn: async () => {
      const response = await api.get('/dashboard/activities')
      return response.data
    },
  })

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['dashboard-projects'],
    queryFn: async () => {
      const response = await api.get('/dashboard/projects')
      return response.data
    },
  })

  const statCards = [
    {
      title: 'Active Projects',
      value: stats?.projects || 0,
      icon: <GitPullRequest className="w-5 h-5" />,
      color: 'primary',
      change: '+2 this week',
    },
    {
      title: 'Team Members',
      value: stats?.teamMembers || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'secondary',
      change: '+3 today',
    },
    {
      title: 'Submissions',
      value: stats?.submissions || 0,
      icon: <FileText className="w-5 h-5" />,
      color: 'success',
      change: '1 pending',
    },
    {
      title: 'Messages',
      value: stats?.messages || 0,
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'warning',
      change: '5 unread',
    },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <GitPullRequest className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name.split(' ')[0]}!</h1>
            <p className="text-gray-400">Here's what's happening with your hackathon projects.</p>
          </div>
          <Link to="/submit">
            <Button leftIcon={<Plus />}>
              New Project
            </Button>
          </Link>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    stat.color === 'primary' ? 'bg-primary-500/20' :
                    stat.color === 'secondary' ? 'bg-secondary-500/20' :
                    stat.color === 'success' ? 'bg-green-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    <div className={
                      stat.color === 'primary' ? 'text-primary-400' :
                      stat.color === 'secondary' ? 'text-secondary-400' :
                      stat.color === 'success' ? 'text-green-400' :
                      'text-yellow-400'
                    }>
                      {stat.icon}
                    </div>
                  </div>
                  <Badge variant={stat.color === 'warning' ? 'warning' : 'primary'}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Projects Progress */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Project Progress</h2>
                  <Link to="/projects">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-6">
                  {projects?.map((project) => (
                    <div key={project.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-gray-400">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            project.status === 'active' ? 'primary' :
                            project.status === 'completed' ? 'success' : 'danger'
                          }>
                            {project.status}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {project.deadline}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <ProgressBar value={project.progress} variant={
                          project.status === 'active' ? 'primary' :
                          project.status === 'completed' ? 'success' : 'danger'
                        } />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{project.teamSize} team members</span>
                        </div>
                        <Link to={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <Card>
                <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
                
                <div className="space-y-4">
                  {activities?.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-1">
                        {activity.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : activity.status === 'warning' ? (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Submission Checklist */}
              <Card className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Submission Checklist</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Functional Prototype', completed: true },
                    { label: 'GitHub Repository', completed: true },
                    { label: 'Demo Video (2-3 min)', completed: false },
                    { label: 'Project Documentation', completed: false },
                    { label: 'Team Information', completed: true },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                      )}
                      <span className={item.completed ? 'text-gray-300' : 'text-gray-500'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-dark-700">
                  <Link to="/submit">
                    <Button fullWidth>
                      Complete Submission
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {activeTab === 'projects' && (
        <Card>
          <div className="text-center py-12">
            <GitPullRequest className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Projects Management</h3>
            <p className="text-gray-400 mb-6">
              View and manage all your hackathon projects in one place.
            </p>
            <Link to="/projects">
              <Button>Browse Projects</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

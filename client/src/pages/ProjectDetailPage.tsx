import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Calendar, 
  Users, 
  Star, 
  GitBranch, 
  Eye, 
  MessageSquare,
  ExternalLink,
  Code,
  Video,
  FileText,
  Share2,
  Bookmark,
  Github,
  Globe
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Tabs from '../components/Tabs'
import api from '../utils/api'

interface ProjectDetail {
  id: string
  title: string
  description: string
  problemStatement: string
  solution: string
  tags: string[]
  techStack: string[]
  repoUrl: string
  demoUrl?: string
  videoUrl: string
  screenshots: string[]
  team: TeamMember[]
  likes: number
  views: number
  comments: number
  createdAt: string
  status: 'active' | 'completed' | 'featured'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  role: string
  skills: string[]
  github?: string
  linkedin?: string
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`)
      return response.data
    },
  })

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Team' },
    { id: 'code', label: 'Code & Tech' },
    { id: 'comments', label: 'Comments' },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <p className="text-gray-400 mb-6">The project you're looking for doesn't exist.</p>
        <Link to="/projects">
          <Button>Browse Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="primary">
                  {tag}
                </Badge>
              ))}
              <Badge variant={project.status === 'featured' ? 'secondary' : 'outline'}>
                {project.status}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-3">{project.title}</h1>
            <p className="text-xl text-gray-400 mb-4">{project.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{project.team.length} team members</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{project.views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>{project.likes} likes</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={<Bookmark />}>
              Save
            </Button>
            <Button variant="outline" leftIcon={<Share2 />}>
              Share
            </Button>
            <Button leftIcon={<Star />}>
              Like
            </Button>
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Screenshots Carousel */}
              {project.screenshots.length > 0 && (
                <Card className="p-0 overflow-hidden">
                  <div className="p-6 border-b border-dark-700">
                    <h3 className="text-xl font-semibold">Project Screenshots</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {project.screenshots.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Problem & Solution */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Problem Statement
                  </h3>
                  <p className="text-gray-300 whitespace-pre-line">
                    {project.problemStatement}
                  </p>
                </Card>

                <Card>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Our Solution
                  </h3>
                  <p className="text-gray-300 whitespace-pre-line">
                    {project.solution}
                  </p>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <Card>
              <h3 className="text-xl font-semibold mb-6">Team Members</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {project.team.map((member) => (
                  <div key={member.id} className="card p-4">
                    <div className="flex items-start gap-4">
                      <Avatar src={member.avatar} name={member.name} size="lg" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{member.name}</h4>
                        <p className="text-primary-400 text-sm mb-2">{member.role}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {member.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="outline" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {member.skills.length > 4 && (
                            <Badge variant="outline" size="sm">
                              +{member.skills.length - 4} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-3">
                          {member.github && (
                            <a
                              href={member.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {member.linkedin && (
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white"
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'code' && (
            <Card>
              <h3 className="text-xl font-semibold mb-6">Technology Stack</h3>
              
              <div className="mb-8">
                <h4 className="font-medium mb-4">Technologies Used</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">GitHub Repository</h4>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300"
                  >
                    <GitBranch className="w-4 h-4" />
                    {project.repoUrl.replace('https://github.com/', '')}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {project.demoUrl && (
                  <div>
                    <h4 className="font-medium mb-2">Live Demo</h4>
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300"
                    >
                      <Globe className="w-4 h-4" />
                      {project.demoUrl.replace('https://', '')}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Demo Video</h4>
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300"
                  >
                    <Video className="w-4 h-4" />
                    Watch on YouTube
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'comments' && (
            <Card>
              <h3 className="text-xl font-semibold mb-6">
                Comments ({project.comments})
              </h3>
              
              <div className="space-y-6">
                {/* Comment Form */}
                <div className="flex gap-4">
                  <Avatar name="You" size="md" />
                  <div className="flex-1">
                    <textarea
                      className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                      placeholder="Add a comment..."
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm">Post Comment</Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 bg-dark-800/50 rounded-lg">
                      <Avatar name={`User ${i}`} size="md" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">User {i}</span>
                          <span className="text-xs text-gray-500">
                            2 hours ago
                          </span>
                        </div>
                        <p className="text-gray-300">
                          This is an amazing project! The implementation is clean
                          and the solution is innovative. Great work team!
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Links Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Project Links</h3>
            <div className="space-y-3">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <div className="p-2 bg-dark-700 rounded-lg">
                  <Github className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">GitHub Repository</div>
                  <div className="text-sm text-gray-400">View source code</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>

              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
                >
                  <div className="p-2 bg-dark-700 rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Live Demo</div>
                    <div className="text-sm text-gray-400">Try it out</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </a>
              )}

              <a
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <div className="p-2 bg-dark-700 rounded-lg">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Demo Video</div>
                  <div className="text-sm text-gray-400">2-3 minute demo</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            </div>
          </Card>

          {/* Team Preview */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Team</h3>
            <div className="space-y-3">
              {project.team.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar src={member.avatar} name={member.name} size="sm" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-400">{member.role}</div>
                  </div>
                </div>
              ))}
              {project.team.length > 4 && (
                <div className="text-center pt-3 border-t border-dark-700">
                  <Link
                    to="#"
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    + {project.team.length - 4} more members
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Similar Projects */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Similar Projects</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Link
                  key={i}
                  to={`/projects/${i}`}
                  className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600/20 to-secondary-600/20 rounded-lg flex items-center justify-center">
                    <Code className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Project Title {i}</div>
                    <div className="text-xs text-gray-400">Web Development</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

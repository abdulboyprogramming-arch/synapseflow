import { useState } from 'react'
import { Search, Filter, Grid, List, TrendingUp, Star, Users, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import ProjectCard from '../components/ProjectCard'
import api from '../utils/api'

interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  techStack: string[]
  teamSize: number
  likes: number
  views: number
  createdAt: string
  status: 'active' | 'completed' | 'featured'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<string>('all')

  // Fetch projects
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      return response.data
    },
  })

  const tags = [
    'Web Development', 'Mobile', 'AI/ML', 'Blockchain', 'IoT', 
    'AR/VR', 'DevOps', 'Security', 'Game Dev', 'Open Source'
  ]

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase()) ||
                         project.description.toLowerCase().includes(search.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => project.tags.includes(tag))
    
    const matchesDifficulty = difficulty === 'all' || project.difficulty === difficulty
    
    return matchesSearch && matchesTags && matchesDifficulty
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Projects</h1>
        <p className="text-gray-400">
          Discover amazing projects built during the hackathon. Get inspired or join a team!
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search projects by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Tags */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter by Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'primary' : 'outline'}
                    onClick={() => toggleTag(tag)}
                    className="cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Difficulty & View */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Difficulty</span>
                </div>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <Button
                      key={diff.value}
                      variant={difficulty === diff.value ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setDifficulty(diff.value)}
                    >
                      {diff.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Star className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">456</div>
              <div className="text-sm text-gray-400">Total Projects</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-500/20 rounded-lg">
              <Users className="w-5 h-5 text-secondary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm text-gray-400">Active Participants</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">48h</div>
              <div className="text-sm text-gray-400">Avg. Build Time</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Projects Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading projects...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {filteredProjects?.length} Projects Found
            </h2>
            <div className="text-sm text-gray-400">
              Sorted by: <span className="text-white">Most Popular</span>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects?.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode="grid"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects?.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode="list"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && filteredProjects?.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-dark-800 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-gray-400 mb-6">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button
            onClick={() => {
              setSearch('')
              setSelectedTags([])
              setDifficulty('all')
            }}
          >
            Clear All Filters
          </Button>
        </Card>
      )}
    </div>
  )
}

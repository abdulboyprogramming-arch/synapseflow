import { useState } from 'react'
import { Search, Filter, Users, Plus, Mail, Calendar, Code } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Avatar from '../components/Avatar'
import api from '../utils/api'

interface Team {
  id: string
  name: string
  description: string
  projectId?: string
  projectTitle?: string
  members: TeamMember[]
  lookingFor: string[]
  maxMembers: number
  isPublic: boolean
  createdAt: string
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  role: string
}

export default function TeamsPage() {
  const [search, setSearch] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get('/teams')
      return response.data
    },
  })

  const skills = [
    'Frontend', 'Backend', 'Full Stack', 'UI/UX Design', 'DevOps',
    'Machine Learning', 'Mobile', 'Blockchain', 'Security', 'Testing'
  ]

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const filteredTeams = teams?.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase()) ||
                         team.description.toLowerCase().includes(search.toLowerCase()) ||
                         team.lookingFor.some(skill => skill.toLowerCase().includes(search.toLowerCase()))
    
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => team.lookingFor.includes(skill))
    
    return matchesSearch && matchesSkills
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Find Your Team</h1>
            <p className="text-gray-400">
              Connect with developers and form the perfect team for your hackathon project.
            </p>
          </div>
          <Button leftIcon={<Plus />}>
            Create Team
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search teams by name, description, or needed skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Skills Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter by Skills Needed</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? 'primary' : 'outline'}
                    onClick={() => toggleSkill(skill)}
                    className="cursor-pointer"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">289</div>
              <div className="text-sm text-gray-400">Active Teams</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-500/20 rounded-lg">
              <Code className="w-5 h-5 text-secondary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-gray-400">Looking for Members</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">48</div>
              <div className="text-sm text-gray-400">New This Week</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">89%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading teams...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {filteredTeams?.length} Teams Found
            </h2>
            <div className="text-sm text-gray-400">
              Showing: <span className="text-white">All teams</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams?.map((team) => (
              <Card key={team.id} className="hover:border-primary-500/30 transition-colors">
                {/* Team Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{team.name}</h3>
                      {team.projectTitle && (
                        <p className="text-sm text-primary-400 mb-2">
                          Project: {team.projectTitle}
                        </p>
                      )}
                    </div>
                    {!team.isPublic && (
                      <Badge variant="outline" size="sm">Private</Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {team.description}
                  </p>
                </div>

                {/* Members */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Team Members</span>
                    <span className="text-sm">
                      {team.members.length}/{team.maxMembers}
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map((member) => (
                      <Avatar
                        key={member.id}
                        src={member.avatar}
                        name={member.name}
                        size="sm"
                        className="border-2 border-dark-800"
                      />
                    ))}
                    {team.members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-dark-700 border-2 border-dark-800 flex items-center justify-center text-xs">
                        +{team.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                {/* Looking For */}
                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-2">Looking for:</div>
                  <div className="flex flex-wrap gap-1">
                    {team.lookingFor.map((skill) => (
                      <Badge key={skill} variant="outline" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Mail />}>
                    Contact
                  </Button>
                  <Button size="sm" fullWidth>
                    Join Team
                  </Button>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-dark-700 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                    <span>{team.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && filteredTeams?.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-dark-800 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No teams found</h3>
          <p className="text-gray-400 mb-4">
            Try adjusting your search or create your own team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setSearch('')
                setSelectedSkills([])
              }}
            >
              Clear Filters
            </Button>
            <Button variant="primary">
              Create New Team
            </Button>
          </div>
        </Card>
      )}

      {/* CTA */}
      <Card className="mt-8">
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Can't find the right team?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Create your own team and invite developers with the exact skills you need.
            Our smart matching system will help you find the perfect teammates.
          </p>
          <Button size="lg" leftIcon={<Plus />}>
            Create Your Team
          </Button>
        </div>
      </Card>
    </div>
  )
}

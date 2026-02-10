// User Types
export interface User {
  _id: string
  email: string
  name: string
  avatar?: string
  bio?: string
  skills: string[]
  github?: string
  linkedin?: string
  role: 'participant' | 'admin'
  createdAt: string
  updatedAt: string
}

// Project Types
export interface Project {
  _id: string
  title: string
  description: string
  problemStatement?: string
  solution?: string
  tags: string[]
  techStack: string[]
  repoUrl: string
  demoUrl?: string
  videoUrl?: string
  screenshots: string[]
  team: TeamMember[]
  status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'completed'
  submissionDate?: string
  createdAt: string
  updatedAt: string
}

// Team Types
export interface Team {
  _id: string
  name: string
  description: string
  projectId?: string
  members: TeamMember[]
  lookingFor: string[]
  maxMembers: number
  isPublic: boolean
  createdAt: string
}

export interface TeamMember {
  userId: string
  role: string
  joinedAt: string
  user?: User // Populated user data
}

// Hackathon Types
export interface Hackathon {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  rules: string[]
  prizes: Prize[]
  status: 'upcoming' | 'active' | 'ended'
}

export interface Prize {
  rank: number
  title: string
  description: string
  value?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  skills: string[]
}

export interface ProjectFormData {
  title: string
  description: string
  problemStatement: string
  solution: string
  tags: string[]
  techStack: string[]
  repoUrl: string
  demoUrl: string
  videoUrl: string
  teamMembers: Array<{
    email: string
    role: string
  }>
}

// Socket Events
export interface SocketEvents {
  'notification:new': (data: Notification) => void
  'team:invite': (data: TeamInvite) => void
  'chat:message': (data: ChatMessage) => void
  'project:update': (data: ProjectUpdate) => void
}

export interface Notification {
  _id: string
  userId: string
  type: 'team_invite' | 'project_update' | 'system'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export interface TeamInvite {
  _id: string
  teamId: string
  teamName: string
  fromUserId: string
  fromUserName: string
  role: string
  status: 'pending' | 'accepted' | 'rejected'
}

export interface ChatMessage {
  _id: string
  roomId: string
  userId: string
  content: string
  type: 'text' | 'code' | 'file'
  createdAt: string
  user?: User
}

export interface ProjectUpdate {
  projectId: string
  type: 'status_change' | 'member_added' | 'submission_updated'
  message: string
  timestamp: string
}

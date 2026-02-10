import mongoose from 'mongoose'

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  isLeader: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  invitationStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'accepted',
  },
})

const teamSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    
    // Project Information
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    projectIdea: {
      type: String,
      maxlength: [1000, 'Project idea cannot exceed 1000 characters'],
      default: '',
    },
    
    // Team Composition
    members: [teamMemberSchema],
    maxMembers: {
      type: Number,
      min: [2, 'Minimum 2 team members required'],
      max: [10, 'Maximum 10 team members allowed'],
      default: 4,
    },
    lookingFor: [{
      type: String,
      trim: true,
    }],
    requiredSkills: [{
      type: String,
      trim: true,
    }],
    
    // Team Preferences
    commitmentLevel: {
      type: String,
      enum: ['casual', 'serious', 'competitive'],
      default: 'serious',
    },
    availability: {
      type: String,
      enum: ['weekdays', 'weekends', 'evenings', 'flexible', 'full-time'],
      default: 'flexible',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    
    // Hackathon Information
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    category: {
      type: String,
      enum: ['web', 'mobile', 'ai-ml', 'blockchain', 'iot', 'ar-vr', 'gaming', 'other'],
      default: 'web',
    },
    
    // Team Status
    status: {
      type: String,
      enum: ['forming', 'active', 'completed', 'disbanded'],
      default: 'forming',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isLookingForMembers: {
      type: Boolean,
      default: true,
    },
    
    // Team Metrics
    totalInvitesSent: {
      type: Number,
      default: 0,
    },
    totalInvitesAccepted: {
      type: Number,
      default: 0,
    },
    
    // Communication
    chatRoomId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // Timeline
    formedAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better query performance
teamSchema.index({ name: 'text', description: 'text' })
teamSchema.index({ hackathonId: 1, status: 1 })
teamSchema.index({ isLookingForMembers: 1 })
teamSchema.index({ lookingFor: 1 })
teamSchema.index({ 'members.userId': 1 })
teamSchema.index({ createdAt: -1 })

// Virtual field for project
teamSchema.virtual('project', {
  ref: 'Project',
  localField: 'projectId',
  foreignField: '_id',
  justOne: true,
})

// Virtual field for hackathon
teamSchema.virtual('hackathon', {
  ref: 'Hackathon',
  localField: 'hackathonId',
  foreignField: '_id',
  justOne: true,
})

// Virtual field for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.filter(m => m.invitationStatus === 'accepted').length
})

// Virtual field for available slots
teamSchema.virtual('availableSlots').get(function() {
  const acceptedMembers = this.members.filter(m => m.invitationStatus === 'accepted').length
  return this.maxMembers - acceptedMembers
})

// Pre-save middleware
teamSchema.pre('save', async function(next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Generate unique chat room ID if not exists
  if (!this.chatRoomId) {
    this.chatRoomId = `team_${this._id}_${Date.now()}`
  }
  
  // Update lastActive timestamp
  if (this.isModified('members') || this.isModified('status')) {
    this.lastActive = new Date()
  }
  
  // Update isLookingForMembers based on available slots
  const acceptedMembers = this.members.filter(m => m.invitationStatus === 'accepted').length
  this.isLookingForMembers = acceptedMembers < this.maxMembers
  
  next()
})

// Check if team is full
teamSchema.methods.isFull = function() {
  const acceptedMembers = this.members.filter(m => m.invitationStatus === 'accepted').length
  return acceptedMembers >= this.maxMembers
}

// Check if user is team member
teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId.toString() === userId.toString() && 
    member.invitationStatus === 'accepted'
  )
}

// Check if user is team leader
teamSchema.methods.isLeader = function(userId) {
  return this.members.some(member => 
    member.userId.toString() === userId.toString() && 
    member.isLeader === true
  )
}

// Add member to team
teamSchema.methods.addMember = async function(userId, role, isLeader = false) {
  if (this.isFull()) {
    throw new Error('Team is full')
  }
  
  // Check if user is already a member
  const existingMember = this.members.find(m => 
    m.userId.toString() === userId.toString()
  )
  
  if (existingMember) {
    if (existingMember.invitationStatus === 'rejected') {
      existingMember.invitationStatus = 'accepted'
      existingMember.role = role
      existingMember.isLeader = isLeader
    }
    // If already accepted, do nothing
  } else {
    this.members.push({
      userId,
      role,
      isLeader,
      invitationStatus: 'accepted',
      joinedAt: new Date(),
    })
  }
  
  await this.save()
}

// Invite member to team
teamSchema.methods.inviteMember = async function(userId, role) {
  if (this.isFull()) {
    throw new Error('Team is full')
  }
  
  // Check if user is already invited or a member
  const existingMember = this.members.find(m => 
    m.userId.toString() === userId.toString()
  )
  
  if (existingMember) {
    if (existingMember.invitationStatus === 'rejected') {
      existingMember.invitationStatus = 'pending'
      existingMember.role = role
    }
    // If already pending or accepted, do nothing
  } else {
    this.members.push({
      userId,
      role,
      isLeader: false,
      invitationStatus: 'pending',
    })
  }
  
  this.totalInvitesSent += 1
  await this.save()
}

// Remove member from team
teamSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => 
    m.userId.toString() === userId.toString()
  )
  
  if (memberIndex === -1) {
    throw new Error('Member not found in team')
  }
  
  // Check if removing the last leader
  const isLeader = this.members[memberIndex].isLeader
  const leadersCount = this.members.filter(m => m.isLeader && m.invitationStatus === 'accepted').length
  
  if (isLeader && leadersCount <= 1) {
    throw new Error('Cannot remove the last team leader')
  }
  
  this.members.splice(memberIndex, 1)
  await this.save()
}

// Get team members with populated user data
teamSchema.methods.getMembersWithUsers = async function() {
  await this.populate('members.userId', 'name email avatar skills experienceLevel')
  return this.members
}

const Team = mongoose.model('Team', teamSchema)

export default Team

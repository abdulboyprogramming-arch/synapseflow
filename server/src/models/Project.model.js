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
  contribution: {
    type: String,
    default: '',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
})

const projectSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    
    // Detailed Information
    problemStatement: {
      type: String,
      required: [true, 'Problem statement is required'],
      maxlength: [2000, 'Problem statement cannot exceed 2000 characters'],
    },
    solution: {
      type: String,
      required: [true, 'Solution is required'],
      maxlength: [2000, 'Solution cannot exceed 2000 characters'],
    },
    features: [{
      type: String,
      trim: true,
    }],
    
    // Technical Information
    techStack: [{
      type: String,
      required: true,
      trim: true,
    }],
    tags: [{
      type: String,
      required: true,
      trim: true,
    }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    
    // Links and Media
    repoUrl: {
      type: String,
      required: [true, 'Repository URL is required'],
      trim: true,
    },
    demoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    videoUrl: {
      type: String,
      required: [true, 'Demo video URL is required'],
      trim: true,
    },
    screenshots: [{
      type: String,
      trim: true,
    }],
    documentation: {
      type: String,
      default: '',
    },
    
    // Team Information
    team: [teamMemberSchema],
    teamSize: {
      type: Number,
      min: [1, 'Team must have at least 1 member'],
      max: [10, 'Team cannot exceed 10 members'],
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
    
    // Submission Information
    submissionDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'submitted', 'under_review', 'selected', 'winner', 'completed'],
      default: 'draft',
    },
    submissionNotes: {
      type: String,
      default: '',
    },
    
    // Judging Information
    judges: [{
      judgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      scores: {
        innovation: { type: Number, min: 0, max: 10 },
        execution: { type: Number, min: 0, max: 10 },
        presentation: { type: Number, min: 0, max: 10 },
        impact: { type: Number, min: 0, max: 10 },
      },
      comments: String,
      judgedAt: Date,
    }],
    averageScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    ranking: {
      type: Number,
      default: null,
    },
    
    // Engagement Metrics
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    
    // Timeline
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    
    // Metadata
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better query performance
projectSchema.index({ title: 'text', description: 'text', tags: 'text' })
projectSchema.index({ hackathonId: 1, status: 1 })
projectSchema.index({ teamSize: 1 })
projectSchema.index({ difficulty: 1 })
projectSchema.index({ averageScore: -1 })
projectSchema.index({ likes: -1 })
projectSchema.index({ views: -1 })
projectSchema.index({ createdAt: -1 })

// Virtual field for comments
projectSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'projectId',
})

// Virtual field for hackathon
projectSchema.virtual('hackathon', {
  ref: 'Hackathon',
  localField: 'hackathonId',
  foreignField: '_id',
  justOne: true,
})

// Pre-save middleware to generate slug and update teamSize
projectSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    // Generate slug from title
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Update teamSize based on team array
  if (this.isModified('team')) {
    this.teamSize = this.team.length
  }
  
  // Update submissionDate when status changes to submitted
  if (this.isModified('status') && this.status === 'submitted' && !this.submissionDate) {
    this.submissionDate = new Date()
  }
  
  next()
})

// Calculate average score method
projectSchema.methods.calculateAverageScore = function() {
  if (this.judges.length === 0) {
    this.averageScore = 0
    return
  }
  
  const totalScores = this.judges.reduce((acc, judge) => {
    const scores = Object.values(judge.scores)
    const judgeAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return acc + judgeAverage
  }, 0)
  
  this.averageScore = totalScores / this.judges.length
}

// Increment views method
projectSchema.methods.incrementViews = async function() {
  this.views += 1
  await this.save()
}

// Increment likes method
projectSchema.methods.incrementLikes = async function() {
  this.likes += 1
  await this.save()
}

// Check if user is team member
projectSchema.methods.isTeamMember = function(userId) {
  return this.team.some(member => member.userId.toString() === userId.toString())
}

// Get team members with populated user data
projectSchema.methods.getTeamWithUsers = async function() {
  await this.populate('team.userId', 'name email avatar skills')
  return this.team
}

const Project = mongoose.model('Project', projectSchema)

export default Project

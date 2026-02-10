import mongoose from 'mongoose'

const prizeSchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: true,
    min: 1,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    default: '',
  },
  sponsors: [{
    name: String,
    logo: String,
  }],
})

const ruleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isImportant: {
    type: Boolean,
    default: false,
  },
})

const hackathonSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Hackathon name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      maxlength: [500, 'Tagline cannot exceed 500 characters'],
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    
    // Organization Information
    organizers: [{
      name: String,
      role: String,
      avatar: String,
      social: String,
    }],
    sponsors: [{
      name: String,
      tier: {
        type: String,
        enum: ['platinum', 'gold', 'silver', 'bronze', 'community'],
      },
      logo: String,
      website: String,
    }],
    
    // Timing Information
    registrationStart: {
      type: Date,
      required: true,
    },
    registrationEnd: {
      type: Date,
      required: true,
    },
    hackathonStart: {
      type: Date,
      required: true,
    },
    hackathonEnd: {
      type: Date,
      required: true,
    },
    judgingStart: {
      type: Date,
      default: null,
    },
    judgingEnd: {
      type: Date,
      default: null,
    },
    resultsAnnouncement: {
      type: Date,
      default: null,
    },
    
    // Location Information
    locationType: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      default: 'online',
    },
    venue: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    
    // Prizes Information
    prizes: [prizeSchema],
    totalPrizePool: {
      type: String,
      default: '',
    },
    
    // Categories Information
    categories: [{
      name: String,
      description: String,
      icon: String,
    }],
    
    // Rules and Requirements
    rules: [ruleSchema],
    eligibility: [{
      type: String,
      required: true,
    }],
    teamSize: {
      min: {
        type: Number,
        min: 1,
        default: 1,
      },
      max: {
        type: Number,
        min: 1,
        default: 5,
      },
    },
    submissionRequirements: [{
      type: String,
      required: true,
    }],
    
    // Technical Information
    techStack: [{
      type: String,
      trim: true,
    }],
    resources: [{
      title: String,
      description: String,
      url: String,
      type: String,
    }],
    apisAndTools: [{
      name: String,
      description: String,
      url: String,
    }],
    
    // Registration Information
    registrationFee: {
      amount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    maxParticipants: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    registrationUrl: {
      type: String,
      default: '',
    },
    
    // Status Information
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'registration_open', 'in_progress', 'judging', 'completed', 'cancelled'],
      default: 'draft',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'invite_only'],
      default: 'public',
    },
    
    // Statistics
    totalRegistrations: {
      type: Number,
      default: 0,
    },
    totalProjects: {
      type: Number,
      default: 0,
    },
    totalTeams: {
      type: Number,
      default: 0,
    },
    
    // Social Media
    socialLinks: {
      website: String,
      twitter: String,
      discord: String,
      linkedin: String,
      github: String,
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
hackathonSchema.index({ name: 'text', description: 'text' })
hackathonSchema.index({ slug: 1 })
hackathonSchema.index({ status: 1 })
hackathonSchema.index({ hackathonStart: 1 })
hackathonSchema.index({ hackathonEnd: 1 })
hackathonSchema.index({ locationType: 1 })
hackathonSchema.index({ createdAt: -1 })

// Virtual field for current status based on dates
hackathonSchema.virtual('currentStatus').get(function() {
  const now = new Date()
  
  if (now < this.registrationStart) return 'upcoming'
  if (now >= this.registrationStart && now <= this.registrationEnd) return 'registration_open'
  if (now >= this.hackathonStart && now <= this.hackathonEnd) return 'in_progress'
  if (now >= this.judgingStart && now <= this.judgingEnd) return 'judging'
  if (now > this.judgingEnd) return 'completed'
  return 'upcoming'
})

// Virtual field for days remaining
hackathonSchema.virtual('daysRemaining').get(function() {
  const now = new Date()
  let targetDate
  
  if (now < this.registrationStart) {
    targetDate = this.registrationStart
  } else if (now < this.hackathonStart) {
    targetDate = this.hackathonStart
  } else if (now < this.hackathonEnd) {
    targetDate = this.hackathonEnd
  } else {
    return 0
  }
  
  const diffTime = targetDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
})

// Pre-save middleware
hackathonSchema.pre('save', async function(next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Update status based on dates
  const statusFromDates = this.currentStatus
  if (statusFromDates !== this.status && this.status !== 'cancelled') {
    this.status = statusFromDates
  }
  
  next()
})

// Method to check if registration is open
hackathonSchema.methods.isRegistrationOpen = function() {
  const now = new Date()
  return now >= this.registrationStart && now <= this.registrationEnd
}

// Method to check if hackathon is active
hackathonSchema.methods.isActive = function() {
  const now = new Date()
  return now >= this.hackathonStart && now <= this.hackathonEnd
}

// Method to check if submission period is open
hackathonSchema.methods.isSubmissionOpen = function() {
  const now = new Date()
  return now >= this.hackathonStart && now <= this.hackathonEnd
}

// Method to get hackathon timeline
hackathonSchema.methods.getTimeline = function() {
  return [
    { event: 'Registration Starts', date: this.registrationStart },
    { event: 'Registration Ends', date: this.registrationEnd },
    { event: 'Hackathon Starts', date: this.hackathonStart },
    { event: 'Hackathon Ends', date: this.hackathonEnd },
    { event: 'Judging Starts', date: this.judgingStart },
    { event: 'Judging Ends', date: this.judgingEnd },
    { event: 'Results Announcement', date: this.resultsAnnouncement },
  ]
}

const Hackathon = mongoose.model('Hackathon', hackathonSchema)

export default Hackathon

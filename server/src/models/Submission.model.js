import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    // Reference Information
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true, // One submission per project
    },
    
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    
    // Submission Content
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    
    summary: {
      type: String,
      required: true,
      maxlength: [1000, 'Summary cannot exceed 1000 characters'],
    },
    
    // Submission Assets
    assets: {
      presentation: {
        type: String,
        default: '',
      },
      demoVideo: {
        type: String,
        required: true,
      },
      screenshots: [{
        type: String,
      }],
      documentation: {
        type: String,
        default: '',
      },
      additionalFiles: [{
        name: String,
        url: String,
        type: String,
      }],
    },
    
    // Technical Information
    deployment: {
      url: String,
      platform: String,
      status: String,
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
        completeness: { type: Number, min: 0, max: 10 },
      },
      comments: String,
      feedback: String,
      judgedAt: Date,
    }],
    
    scores: {
      innovation: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      execution: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      presentation: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      impact: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      completeness: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
    },
    
    totalScore: {
      type: Number,
      min: 0,
      max: 50,
      default: 0,
    },
    
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
    
    // Status Information
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'winner', 'runner_up', 'honorable_mention'],
      default: 'draft',
    },
    
    submissionStatus: {
      isLate: {
        type: Boolean,
        default: false,
      },
      isComplete: {
        type: Boolean,
        default: false,
      },
      hasDisqualification: {
        type: Boolean,
        default: false,
      },
      disqualificationReason: {
        type: String,
        default: '',
      },
    },
    
    // Timeline
    submittedAt: {
      type: Date,
      default: null,
    },
    
    reviewedAt: {
      type: Date,
      default: null,
    },
    
    // Metadata
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Versioning
    version: {
      type: Number,
      default: 1,
    },
    
    previousVersions: [{
      version: Number,
      data: mongoose.Schema.Types.Mixed,
      savedAt: Date,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better query performance
submissionSchema.index({ projectId: 1 })
submissionSchema.index({ hackathonId: 1, status: 1 })
submissionSchema.index({ teamId: 1 })
submissionSchema.index({ totalScore: -1 })
submissionSchema.index({ submittedAt: -1 })
submissionSchema.index({ ranking: 1 })

// Virtual field for project
submissionSchema.virtual('project', {
  ref: 'Project',
  localField: 'projectId',
  foreignField: '_id',
  justOne: true,
})

// Virtual field for hackathon
submissionSchema.virtual('hackathon', {
  ref: 'Hackathon',
  localField: 'hackathonId',
  foreignField: '_id',
  justOne: true,
})

// Virtual field for team
submissionSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
})

// Pre-save middleware
submissionSchema.pre('save', async function(next) {
  // Update submittedAt on first submission
  if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date()
  }
  
  // Calculate scores if judges exist
  if (this.isModified('judges') && this.judges.length > 0) {
    this.calculateScores()
  }
  
  next()
})

// Method to calculate scores
submissionSchema.methods.calculateScores = function() {
  if (this.judges.length === 0) return
  
  const scoreSums = {
    innovation: 0,
    execution: 0,
    presentation: 0,
    impact: 0,
    completeness: 0,
  }
  
  // Sum up all judge scores
  this.judges.forEach(judge => {
    Object.keys(judge.scores).forEach(criteria => {
      scoreSums[criteria] += judge.scores[criteria]
    })
  })
  
  // Calculate averages
  Object.keys(scoreSums).forEach(criteria => {
    this.scores[criteria] = scoreSums[criteria] / this.judges.length
  })
  
  // Calculate total and average
  const scoreValues = Object.values(this.scores)
  this.totalScore = scoreValues.reduce((sum, score) => sum + score, 0)
  this.averageScore = this.totalScore / scoreValues.length
}

// Method to add judge evaluation
submissionSchema.methods.addJudgeEvaluation = async function(judgeId, scores, comments, feedback) {
  const existingIndex = this.judges.findIndex(j => j.judgeId.toString() === judgeId.toString())
  
  if (existingIndex !== -1) {
    // Update existing evaluation
    this.judges[existingIndex] = {
      judgeId,
      scores,
      comments,
      feedback,
      judgedAt: new Date(),
    }
  } else {
    // Add new evaluation
    this.judges.push({
      judgeId,
      scores,
      comments,
      feedback,
      judgedAt: new Date(),
    })
  }
  
  // Recalculate scores
  this.calculateScores()
  
  // Update status if this is the first review
  if (this.status === 'submitted' || this.status === 'under_review') {
    this.status = 'under_review'
    this.reviewedAt = new Date()
  }
  
  await this.save()
}

// Method to check if submission is complete
submissionSchema.methods.checkCompleteness = function() {
  const hasRequiredAssets = 
    this.assets.demoVideo &&
    this.assets.screenshots.length > 0
  
  const hasRequiredInfo = 
    this.title &&
    this.summary
  
  this.submissionStatus.isComplete = hasRequiredAssets && hasRequiredInfo
  return this.submissionStatus.isComplete
}

// Method to save version
submissionSchema.methods.saveVersion = async function() {
  const versionData = {
    title: this.title,
    summary: this.summary,
    assets: this.assets,
    scores: this.scores,
    status: this.status,
  }
  
  this.previousVersions.push({
    version: this.version,
    data: versionData,
    savedAt: new Date(),
  })
  
  this.version += 1
  await this.save()
}

// Static method to get leaderboard
submissionSchema.statics.getLeaderboard = async function(hackathonId, limit = 20) {
  const Submission = this
  
  return await Submission.find({ hackathonId })
    .where('status').in(['accepted', 'winner', 'runner_up', 'honorable_mention'])
    .sort({ totalScore: -1, submittedAt: 1 })
    .limit(limit)
    .populate('project', 'title description')
    .populate('team', 'name')
    .lean()
}

const Submission = mongoose.model('Submission', submissionSchema)

export default Submission

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    
    // Profile Information
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    
    // Professional Information
    skills: [{
      type: String,
      trim: true,
    }],
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
    },
    
    // Hackathon Information
    hackathonInterests: [{
      type: String,
      trim: true,
    }],
    lookingForTeam: {
      type: Boolean,
      default: true,
    },
    availability: {
      type: String,
      enum: ['full-time', 'part-time', 'weekends', 'evenings'],
      default: 'part-time',
    },
    
    // System Information
    role: {
      type: String,
      enum: ['participant', 'judge', 'admin', 'mentor'],
      default: 'participant',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Statistics
    totalProjects: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    
    // Preferences
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    
    // Timestamps
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better query performance
userSchema.index({ email: 1 })
userSchema.index({ skills: 1 })
userSchema.index({ experienceLevel: 1 })
userSchema.index({ lookingForTeam: 1 })
userSchema.index({ createdAt: -1 })

// Virtual field for projects
userSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'team.userId',
})

// Virtual field for teams
userSchema.virtual('teams', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'members.userId',
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  )
}

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' }
  )
}

// Public profile method
userSchema.methods.toPublicProfile = function() {
  const user = this.toObject()
  
  // Remove sensitive information
  delete user.password
  delete user.__v
  delete user.createdAt
  delete user.updatedAt
  delete user.emailNotifications
  delete user.pushNotifications
  
  return user
}

// Update statistics method
userSchema.methods.updateStats = async function() {
  const Project = mongoose.model('Project')
  
  const projectCount = await Project.countDocuments({
    'team.userId': this._id,
    status: { $ne: 'draft' }
  })
  
  this.totalProjects = projectCount
  await this.save()
}

const User = mongoose.model('User', userSchema)

export default User

import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Notification Content
    type: {
      type: String,
      enum: [
        'team_invite',
        'team_join_request',
        'team_acceptance',
        'team_rejection',
        'project_update',
        'submission_status',
        'judging_result',
        'new_message',
        'deadline_reminder',
        'announcement',
        'system'
      ],
      required: true,
    },
    
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    
    // Notification Data
    data: {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
      hackathonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      // Additional dynamic data
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    
    // Action Links
    actionLink: {
      type: String,
      default: '',
    },
    actionText: {
      type: String,
      default: 'View',
    },
    
    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    
    // Delivery Status
    emailSent: {
      type: Boolean,
      default: false,
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    
    // Expiration
    expiresAt: {
      type: Date,
      default: function() {
        // Notifications expire after 30 days
        const date = new Date()
        date.setDate(date.getDate() + 30)
        return date
      },
    },
    
    // Timestamps
    readAt: {
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
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ type: 1, createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Update readAt timestamp when marked as read
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date()
  }
  
  next()
})

// Static method to create team invitation notification
notificationSchema.statics.createTeamInvite = async function(userId, teamId, inviterId, teamName) {
  const Notification = this
  const User = mongoose.model('User')
  
  const inviter = await User.findById(inviterId).select('name')
  
  return await Notification.create({
    userId,
    type: 'team_invite',
    title: 'Team Invitation',
    message: `${inviter?.name || 'Someone'} has invited you to join team "${teamName}"`,
    data: {
      teamId,
      userId: inviterId,
      metadata: {
        teamName,
        inviterName: inviter?.name,
      },
    },
    actionLink: `/teams/${teamId}`,
    actionText: 'View Invitation',
    priority: 'high',
  })
}

// Static method to create project status update notification
notificationSchema.statics.createProjectUpdate = async function(userId, projectId, projectTitle, updateType, message) {
  const Notification = this
  
  return await Notification.create({
    userId,
    type: 'project_update',
    title: `Project Update: ${projectTitle}`,
    message,
    data: {
      projectId,
      metadata: {
        projectTitle,
        updateType,
      },
    },
    actionLink: `/projects/${projectId}`,
    actionText: 'View Project',
    priority: 'medium',
  })
}

// Static method to create deadline reminder
notificationSchema.statics.createDeadlineReminder = async function(userId, hackathonId, hackathonName, deadlineType, daysLeft) {
  const Notification = this
  
  const messages = {
    registration: `Registration for ${hackathonName} closes in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    submission: `Submission deadline for ${hackathonName} is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    judging: `Judging for ${hackathonName} ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
  }
  
  return await Notification.create({
    userId,
    type: 'deadline_reminder',
    title: 'Deadline Reminder',
    message: messages[deadlineType] || `Deadline for ${hackathonName} is approaching`,
    data: {
      hackathonId,
      metadata: {
        hackathonName,
        deadlineType,
        daysLeft,
      },
    },
    actionLink: `/hackathons/${hackathonId}`,
    actionText: 'View Hackathon',
    priority: daysLeft <= 1 ? 'urgent' : 'high',
  })
}

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true
  this.readAt = new Date()
  await this.save()
}

// Method to archive notification
notificationSchema.methods.archive = async function() {
  this.isArchived = true
  await this.save()
}

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification

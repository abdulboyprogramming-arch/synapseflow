import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    // Room/Channel Information
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    roomType: {
      type: String,
      enum: ['team', 'project', 'direct', 'group'],
      required: true,
    },
    
    // Sender Information
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Message Content
    type: {
      type: String,
      enum: ['text', 'code', 'file', 'system', 'announcement'],
      default: 'text',
    },
    
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    
    // For code messages
    language: {
      type: String,
      default: '',
    },
    
    // For file messages
    file: {
      name: String,
      url: String,
      size: Number,
      type: String,
    },
    
    // Message Metadata
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    
    // Reactions
    reactions: [{
      emoji: String,
      userIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
    }],
    
    // Mentions
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    
    // Thread/Reply Information
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isThread: {
      type: Boolean,
      default: false,
    },
    threadCount: {
      type: Number,
      default: 0,
    },
    
    // Read Receipts
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Delivery Status
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    
    // Pinned Status
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pinnedAt: {
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
messageSchema.index({ roomId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1, createdAt: -1 })
messageSchema.index({ parentMessageId: 1 })
messageSchema.index({ 'mentions.userId': 1 })

// Virtual field for sender
messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
})

// Pre-save middleware
messageSchema.pre('save', async function(next) {
  // Update thread count for parent message
  if (this.parentMessageId && !this.isThread) {
    const Message = mongoose.model('Message')
    await Message.findByIdAndUpdate(this.parentMessageId, {
      $inc: { threadCount: 1 },
    })
  }
  
  next()
})

// Static method to create system message
messageSchema.statics.createSystemMessage = async function(roomId, roomType, content) {
  const Message = this
  
  return await Message.create({
    roomId,
    roomType,
    senderId: null, // System messages have no sender
    type: 'system',
    content,
  })
}

// Static method to create announcement
messageSchema.statics.createAnnouncement = async function(roomId, roomType, senderId, content) {
  const Message = this
  
  return await Message.create({
    roomId,
    roomType,
    senderId,
    type: 'announcement',
    content,
  })
}

// Method to add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  const reactionIndex = this.reactions.findIndex(r => r.emoji === emoji)
  
  if (reactionIndex === -1) {
    // New reaction
    this.reactions.push({
      emoji,
      userIds: [userId],
    })
  } else {
    // Existing reaction, add user if not already
    const reaction = this.reactions[reactionIndex]
    if (!reaction.userIds.some(id => id.toString() === userId.toString())) {
      reaction.userIds.push(userId)
    }
  }
  
  await this.save()
}

// Method to remove reaction
messageSchema.methods.removeReaction = async function(userId, emoji) {
  const reactionIndex = this.reactions.findIndex(r => r.emoji === emoji)
  
  if (reactionIndex !== -1) {
    const reaction = this.reactions[reactionIndex]
    reaction.userIds = reaction.userIds.filter(id => id.toString() !== userId.toString())
    
    // Remove reaction if no users left
    if (reaction.userIds.length === 0) {
      this.reactions.splice(reactionIndex, 1)
    }
  }
  
  await this.save()
}

// Method to mark as read by user
messageSchema.methods.markAsRead = async function(userId) {
  const existingRead = this.readBy.find(r => r.userId.toString() === userId.toString())
  
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date(),
    })
    await this.save()
  }
}

// Method to mark as delivered
messageSchema.methods.markAsDelivered = async function() {
  if (!this.delivered) {
    this.delivered = true
    this.deliveredAt = new Date()
    await this.save()
  }
}

// Method to pin message
messageSchema.methods.pinMessage = async function(userId) {
  this.pinned = true
  this.pinnedBy = userId
  this.pinnedAt = new Date()
  await this.save()
}

// Method to unpin message
messageSchema.methods.unpinMessage = async function() {
  this.pinned = false
  this.pinnedBy = null
  this.pinnedAt = null
  await this.save()
}

// Method to edit message
messageSchema.methods.editMessage = async function(newContent) {
  this.content = newContent
  this.edited = true
  this.editedAt = new Date()
  await this.save()
}

// Method to delete message (soft delete)
messageSchema.methods.deleteMessage = async function() {
  this.deleted = true
  this.deletedAt = new Date()
  this.content = '[This message was deleted]'
  await this.save()
}

const Message = mongoose.model('Message', messageSchema)

export default Message

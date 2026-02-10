import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import Message from '../models/Message.model.js'
import Notification from '../models/Notification.model.js'

// Store connected users
const connectedUsers = new Map()

// Socket event types
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  
  // Message events
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  
  // Team events
  TEAM_UPDATE: 'team_update',
  TEAM_INVITE: 'team_invite',
  TEAM_JOIN: 'team_join',
  TEAM_LEAVE: 'team_leave',
  
  // Project events
  PROJECT_UPDATE: 'project_update',
  PROJECT_SUBMISSION: 'project_submission',
  PROJECT_STATUS_CHANGE: 'project_status_change',
  
  // Notification events
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  
  // System events
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
}

// @desc    Initialize Socket.IO server
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select('_id name email role')
      
      if (!user) {
        return next(new Error('User not found'))
      }

      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`User connected: ${socket.user._id} (${socket.user.name})`)

    // Store user connection
    connectedUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      user: socket.user,
      rooms: new Set(),
    })

    // Send connection confirmation
    socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
      userId: socket.user._id,
      message: 'Connected to WebSocket server',
    })

    // Handle joining rooms
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (roomId) => {
      try {
        socket.join(roomId)
        
        const userData = connectedUsers.get(socket.user._id.toString())
        if (userData) {
          userData.rooms.add(roomId)
        }

        // Notify room members
        socket.to(roomId).emit(SOCKET_EVENTS.ROOM_JOINED, {
          userId: socket.user._id,
          userName: socket.user.name,
          roomId,
          timestamp: new Date(),
        })

        socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
          roomId,
          message: `Joined room: ${roomId}`,
        })

        console.log(`User ${socket.user._id} joined room: ${roomId}`)
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to join room',
          error: error.message,
        })
      }
    })

    // Handle leaving rooms
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
      socket.leave(roomId)
      
      const userData = connectedUsers.get(socket.user._id.toString())
      if (userData) {
        userData.rooms.delete(roomId)
      }

      socket.emit(SOCKET_EVENTS.ROOM_LEFT, {
        roomId,
        message: `Left room: ${roomId}`,
      })

      console.log(`User ${socket.user._id} left room: ${roomId}`)
    })

    // Handle sending messages
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
      try {
        const { roomId, content, type = 'text', metadata = {} } = data
        
        if (!roomId || !content) {
          throw new Error('Room ID and content are required')
        }

        // Create message in database
        const message = await Message.create({
          roomId,
          roomType: metadata.roomType || 'team',
          senderId: socket.user._id,
          type,
          content,
          readBy: [{
            userId: socket.user._id,
            readAt: new Date(),
          }],
          delivered: true,
          deliveredAt: new Date(),
        })

        // Populate sender info
        await message.populate('sender', 'name avatar')

        // Prepare message data for clients
        const messageData = {
          id: message._id,
          roomId,
          sender: {
            id: socket.user._id,
            name: socket.user.name,
            avatar: message.sender?.avatar,
          },
          content,
          type,
          metadata,
          timestamp: message.createdAt,
          delivered: true,
          readBy: [socket.user._id],
        }

        // Broadcast to room
        io.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, messageData)

        // Send confirmation to sender
        socket.emit(SOCKET_EVENTS.MESSAGE_SENT, {
          messageId: message._id,
          roomId,
          timestamp: new Date(),
        })

        console.log(`Message sent in room ${roomId} by ${socket.user._id}`)
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to send message',
          error: error.message,
        })
      }
    })

    // Handle typing indicators
    socket.on(SOCKET_EVENTS.TYPING, (data) => {
      const { roomId } = data
      socket.to(roomId).emit(SOCKET_EVENTS.TYPING, {
        userId: socket.user._id,
        userName: socket.user.name,
        roomId,
      })
    })

    socket.on(SOCKET_EVENTS.STOP_TYPING, (data) => {
      const { roomId } = data
      socket.to(roomId).emit(SOCKET_EVENTS.STOP_TYPING, {
        userId: socket.user._id,
        roomId,
      })
    })

    // Handle team updates
    socket.on(SOCKET_EVENTS.TEAM_UPDATE, (data) => {
      const { teamId, update } = data
      socket.to(`team_${teamId}`).emit(SOCKET_EVENTS.TEAM_UPDATE, {
        teamId,
        update,
        updatedBy: socket.user._id,
        timestamp: new Date(),
      })
    })

    // Handle project updates
    socket.on(SOCKET_EVENTS.PROJECT_UPDATE, (data) => {
      const { projectId, update } = data
      socket.to(`project_${projectId}`).emit(SOCKET_EVENTS.PROJECT_UPDATE, {
        projectId,
        update,
        updatedBy: socket.user._id,
        timestamp: new Date(),
      })
    })

    // Handle ping/pong for connection health
    socket.on(SOCKET_EVENTS.PING, () => {
      socket.emit(SOCKET_EVENTS.PONG, { timestamp: new Date() })
    })

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`User disconnected: ${socket.user._id}`)
      
      // Remove from connected users
      connectedUsers.delete(socket.user._id.toString())
      
      // Notify rooms about disconnection
      const userData = connectedUsers.get(socket.user._id.toString())
      if (userData) {
        userData.rooms.forEach(roomId => {
          socket.to(roomId).emit(SOCKET_EVENTS.ROOM_LEFT, {
            userId: socket.user._id,
            roomId,
            timestamp: new Date(),
          })
        })
      }
    })

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  return io
}

// @desc    Get connected users in a room
export const getConnectedUsersInRoom = (roomId) => {
  const users = []
  
  connectedUsers.forEach((userData, userId) => {
    if (userData.rooms.has(roomId)) {
      users.push({
        userId,
        name: userData.user.name,
        socketId: userData.socketId,
      })
    }
  })
  
  return users
}

// @desc    Send notification to user via socket
export const sendNotification = (io, userId, notification) => {
  const userData = connectedUsers.get(userId.toString())
  
  if (userData) {
    io.to(userData.socketId).emit(SOCKET_EVENTS.NOTIFICATION, notification)
    return true
  }
  
  return false
}

// @desc    Broadcast to team members
export const broadcastToTeam = (io, teamId, event, data) => {
  const roomId = `team_${teamId}`
  io.to(roomId).emit(event, data)
}

// @desc    Broadcast to project team
export const broadcastToProjectTeam = (io, projectId, event, data) => {
  const roomId = `project_${projectId}`
  io.to(roomId).emit(event, data)
}

// @desc    Check if user is connected
export const isUserConnected = (userId) => {
  return connectedUsers.has(userId.toString())
}

// @desc    Get user's socket ID
export const getUserSocketId = (userId) => {
  const userData = connectedUsers.get(userId.toString())
  return userData?.socketId
}

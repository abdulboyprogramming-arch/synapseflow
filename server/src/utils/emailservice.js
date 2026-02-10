import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection error:', error)
  } else {
    console.log('SMTP server is ready to send emails')
  }
})

// Load email templates
const loadTemplate = async (templateName, context = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`)
    let template = await fs.readFile(templatePath, 'utf8')
    
    // Replace template variables
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, context[key])
    })
    
    return template
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error)
    return null
  }
}

// @desc    Send email
export const sendEmail = async (options) => {
  const {
    to,
    subject,
    text,
    html,
    template,
    context = {},
    attachments = [],
  } = options

  // Check if email sending is disabled
  if (process.env.EMAIL_ENABLED === 'false') {
    console.log('Email sending is disabled. Email would have been sent:', {
      to,
      subject,
      template,
    })
    return { success: true, testMode: true }
  }

  try {
    let emailHtml = html

    // Load template if specified
    if (template && !html) {
      emailHtml = await loadTemplate(template, context)
      
      if (!emailHtml) {
        throw new Error(`Failed to load email template: ${template}`)
      }
    }

    // Default from address
    const from = process.env.EMAIL_FROM || 'SynapseFlow <noreply@synapseflow.com>'

    // Prepare email options
    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || subject,
      html: emailHtml,
      attachments,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent:', {
      to,
      subject,
      messageId: info.messageId,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

// @desc    Send welcome email
export const sendWelcomeEmail = async (user) => {
  const { name, email } = user

  return sendEmail({
    to: email,
    subject: 'Welcome to SynapseFlow! 🚀',
    template: 'welcome',
    context: {
      name,
      loginUrl: `${process.env.CLIENT_URL}/login`,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
      exploreUrl: `${process.env.CLIENT_URL}/projects`,
    },
  })
}

// @desc    Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const { name, email } = user
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - SynapseFlow',
    template: 'password-reset',
    context: {
      name,
      resetUrl,
      expiryTime: '1 hour',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@synapseflow.com',
    },
  })
}

// @desc    Send team invitation email
export const sendTeamInvitationEmail = async (inviter, invitee, team, invitationToken) => {
  const acceptUrl = `${process.env.CLIENT_URL}/teams/${team._id}/invitation/${invitationToken}`
  const declineUrl = `${process.env.CLIENT_URL}/teams/${team._id}/decline/${invitationToken}`

  return sendEmail({
    to: invitee.email,
    subject: `Team Invitation: ${team.name}`,
    template: 'team-invitation',
    context: {
      inviterName: inviter.name,
      teamName: team.name,
      teamDescription: team.description,
      acceptUrl,
      declineUrl,
      expiryTime: '7 days',
    },
  })
}

// @desc    Send project submission confirmation
export const sendSubmissionConfirmationEmail = async (user, project, hackathon) => {
  const { name, email } = user

  return sendEmail({
    to: email,
    subject: `Project Submitted: ${project.title}`,
    template: 'project-submitted',
    context: {
      name,
      projectTitle: project.title,
      hackathonName: hackathon.name,
      projectUrl: `${process.env.CLIENT_URL}/projects/${project._id}`,
      hackathonUrl: `${process.env.CLIENT_URL}/hackathons/${hackathon._id}`,
      submissionDate: new Date(project.submissionDate).toLocaleDateString(),
    },
  })
}

// @desc    Send deadline reminder
export const sendDeadlineReminderEmail = async (user, hackathon, daysLeft, deadlineType) => {
  const { name, email } = user

  const deadlineTypes = {
    registration: 'Registration',
    submission: 'Submission',
    judging: 'Judging',
  }

  const deadlineDate = {
    registration: hackathon.registrationEnd,
    submission: hackathon.hackathonEnd,
    judging: hackathon.judgingEnd,
  }[deadlineType]

  return sendEmail({
    to: email,
    subject: `Reminder: ${deadlineTypes[deadlineType]} Deadline in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`,
    template: 'deadline-reminder',
    context: {
      name,
      hackathonName: hackathon.name,
      deadlineType: deadlineTypes[deadlineType],
      daysLeft,
      deadlineDate: new Date(deadlineDate).toLocaleDateString(),
      hackathonUrl: `${process.env.CLIENT_URL}/hackathons/${hackathon._id}`,
      projectsUrl: `${process.env.CLIENT_URL}/dashboard`,
    },
  })
}

// @desc    Send judging results email
export const sendJudgingResultsEmail = async (user, project, hackathon, ranking) => {
  const { name, email } = user

  let subject = 'Judging Results: '
  let resultType = ''

  if (ranking === 1) {
    subject += 'Congratulations! You Won! 🏆'
    resultType = 'Winner'
  } else if (ranking <= 3) {
    subject += `Congratulations! ${ranking}${getOrdinal(ranking)} Place!`
    resultType = `${ranking}${getOrdinal(ranking)} Place`
  } else {
    subject += 'Judging Complete - Thank You!'
    resultType = 'Participant'
  }

  return sendEmail({
    to: email,
    subject,
    template: 'judging-results',
    context: {
      name,
      projectTitle: project.title,
      hackathonName: hackathon.name,
      resultType,
      ranking: ranking ? `${ranking}${getOrdinal(ranking)}` : 'N/A',
      projectScore: project.averageScore ? project.averageScore.toFixed(1) : 'N/A',
      projectUrl: `${process.env.CLIENT_URL}/projects/${project._id}`,
      leaderboardUrl: `${process.env.CLIENT_URL}/hackathons/${hackathon._id}/leaderboard`,
      nextHackathonUrl: `${process.env.CLIENT_URL}/hackathons`,
    },
  })
}

// @desc    Send weekly digest
export const sendWeeklyDigest = async (user, digestData) => {
  const { name, email } = user
  const {
    newProjects = 0,
    newTeams = 0,
    upcomingDeadlines = [],
    recommendedProjects = [],
    recommendedTeams = [],
  } = digestData

  return sendEmail({
    to: email,
    subject: 'Your Weekly SynapseFlow Digest',
    template: 'weekly-digest',
    context: {
      name,
      newProjects,
      newTeams,
      upcomingDeadlines: upcomingDeadlines.map(deadline => ({
        name: deadline.name,
        date: new Date(deadline.date).toLocaleDateString(),
        daysLeft: deadline.daysLeft,
        url: `${process.env.CLIENT_URL}/hackathons/${deadline.hackathonId}`,
      })),
      recommendedProjects: recommendedProjects.slice(0, 3).map(project => ({
        title: project.title,
        description: project.description.substring(0, 100) + '...',
        url: `${process.env.CLIENT_URL}/projects/${project._id}`,
      })),
      recommendedTeams: recommendedTeams.slice(0, 3).map(team => ({
        name: team.name,
        lookingFor: team.lookingFor.slice(0, 3).join(', '),
        url: `${process.env.CLIENT_URL}/teams/${team._id}`,
      })),
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
      unsubscribeUrl: `${process.env.CLIENT_URL}/settings/notifications`,
    },
  })
}

// Helper function for ordinal numbers
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import '../config/database.js'
import User from '../models/User.model.js'
import Hackathon from '../models/Hackathon.model.js'
import logger from '../utils/logger.js'

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...')

    // Clear existing data
    await User.deleteMany({})
    await Hackathon.deleteMany({})
    logger.info('Cleared existing data')

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10)
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@synapseflow.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
      experienceLevel: 'expert',
      lookingForTeam: false,
    })
    logger.info('Created admin user')

    // Create sample users
    const sampleUsers = [
      {
        name: 'John Developer',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        skills: ['React', 'JavaScript', 'CSS', 'HTML'],
        experienceLevel: 'intermediate',
        lookingForTeam: true,
        bio: 'Full-stack developer passionate about hackathons',
      },
      {
        name: 'Sarah Designer',
        email: 'sarah@example.com',
        password: await bcrypt.hash('password123', 10),
        skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Prototyping'],
        experienceLevel: 'advanced',
        lookingForTeam: true,
        bio: 'UI/UX designer with 5 years of experience',
      },
      {
        name: 'Mike Backend',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 10),
        skills: ['Node.js', 'Python', 'Docker', 'AWS'],
        experienceLevel: 'advanced',
        lookingForTeam: true,
        bio: 'Backend engineer specializing in cloud infrastructure',
      },
      {
        name: 'Emma AI',
        email: 'emma@example.com',
        password: await bcrypt.hash('password123', 10),
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science'],
        experienceLevel: 'intermediate',
        lookingForTeam: true,
        bio: 'AI/ML engineer passionate about innovative solutions',
      },
    ]

    const createdUsers = await User.insertMany(sampleUsers)
    logger.info(`Created ${createdUsers.length} sample users`)

    // Create sample hackathons
    const sampleHackathons = [
      {
        name: 'CodeSpring Hackathon 2024',
        slug: 'codespring-hackathon-2024',
        tagline: 'Build the future in 48 hours',
        description: 'An intense innovation challenge where brilliant minds come together to build, break, and create under pressure.',
        logo: 'https://res.cloudinary.com/your-cloud/image/upload/v1/hackathons/codespring/logo',
        banner: 'https://res.cloudinary.com/your-cloud/image/upload/v1/hackathons/codespring/banner',
        organizers: [
          { name: 'Tech Innovators Inc.', role: 'Organizer', social: '@techinnovators' },
          { name: 'Developer Community', role: 'Co-organizer', social: '@devcommunity' },
        ],
        registrationStart: new Date('2024-05-01'),
        registrationEnd: new Date('2024-05-14'),
        hackathonStart: new Date('2024-05-15'),
        hackathonEnd: new Date('2024-05-17'),
        judgingStart: new Date('2024-05-18'),
        judgingEnd: new Date('2024-05-20'),
        resultsAnnouncement: new Date('2024-05-21'),
        locationType: 'online',
        prizes: [
          {
            rank: 1,
            title: 'Grand Prize',
            description: 'Overall best project',
            value: '$10,000 + Mentorship',
            sponsors: [{ name: 'Tech Giants', logo: '' }],
          },
          {
            rank: 2,
            title: 'Second Place',
            description: 'Runner-up',
            value: '$5,000',
          },
          {
            rank: 3,
            title: 'Third Place',
            description: 'Third place winner',
            value: '$2,500',
          },
        ],
        categories: [
          { name: 'Web Development', description: 'Web applications and services', icon: '🌐' },
          { name: 'Mobile', description: 'iOS and Android applications', icon: '📱' },
          { name: 'AI/ML', description: 'Artificial Intelligence and Machine Learning', icon: '🤖' },
          { name: 'Blockchain', description: 'Decentralized applications', icon: '⛓️' },
        ],
        rules: [
          {
            title: 'Eligibility',
            description: 'Participants must be above the legal age of majority in their country of residence',
            isImportant: true,
          },
          {
            title: 'Team Size',
            description: 'Teams can have 1-5 members',
            isImportant: true,
          },
          {
            title: 'Original Work',
            description: 'All code must be written during the hackathon',
            isImportant: true,
          },
        ],
        eligibility: [
          'Above legal age of majority in country of residence',
          'Students and professionals welcome',
          'All countries/territories, excluding standard exceptions',
        ],
        submissionRequirements: [
          'Functional prototype or working project',
          'GitHub repository link',
          '2-3 minute demo video',
          'Project documentation',
          'Team information',
        ],
        techStack: ['React', 'Node.js', 'Python', 'MongoDB', 'Docker', 'AWS'],
        resources: [
          {
            title: 'Getting Started Guide',
            description: 'Beginner-friendly tutorial',
            url: 'https://docs.codespring.com/guide',
            type: 'documentation',
          },
          {
            title: 'API Documentation',
            description: 'Available APIs and tools',
            url: 'https://docs.codespring.com/api',
            type: 'documentation',
          },
        ],
        apisAndTools: [
          {
            name: 'GitHub API',
            description: 'Access to GitHub repositories',
            url: 'https://api.github.com',
          },
          {
            name: 'OpenAI API',
            description: 'AI and machine learning capabilities',
            url: 'https://openai.com/api',
          },
        ],
        status: 'registration_open',
        visibility: 'public',
        createdBy: adminUser._id,
      },
      {
        name: 'AI Innovation Challenge',
        slug: 'ai-innovation-challenge',
        tagline: 'Building intelligent solutions for tomorrow',
        description: 'A specialized hackathon focused on artificial intelligence and machine learning applications.',
        registrationStart: new Date('2024-06-01'),
        registrationEnd: new Date('2024-06-14'),
        hackathonStart: new Date('2024-06-15'),
        hackathonEnd: new Date('2024-06-16'),
        locationType: 'hybrid',
        venue: 'Tech Conference Center',
        city: 'San Francisco',
        country: 'USA',
        status: 'upcoming',
        visibility: 'public',
        createdBy: adminUser._id,
      },
    ]

    const createdHackathons = await Hackathon.insertMany(sampleHackathons)
    logger.info(`Created ${createdHackathons.length} sample hackathons`)

    logger.info('✅ Database seeding completed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('❌ Database seeding failed:', error)
    process.exit(1)
  }
}

// Run seeding
if (process.argv[2] === '--seed') {
  seedDatabase()
}

export default seedDatabase

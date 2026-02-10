# 🚀 SynapseFlow - CodeSpring Hackathon Project

[![CodeSpring Hackathon](https://img.shields.io/badge/CodeSpring-Hackathon-blueviolet)](https://codespring.example.com)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://synapseflow.vercel.app)

## 📋 Overview
**SynapseFlow** is a collaborative platform built for hackathon participants to rapidly form teams, manage projects, and submit their final work—all in one place. Created for the CodeSpring Hackathon, it streamlines the entire hackathon lifecycle from team formation to final submission.

### ✨ Key Features
- **👥 Smart Team Matching**: AI-powered suggestions based on skills and project needs
- **⚡ Rapid Project Setup**: One-click project creation with templates
- **🔗 Portfolio Integration**: Import skills directly from GitHub/LinkedIn
- **🎬 Submission Portal**: Complete submission checklist with video upload and repo linking
- **🌐 Real-time Collaboration**: Live chat, task assignment, and progress tracking
- **📊 Dashboard Analytics**: Track team progress and submission readiness

## 🖼️ Screenshots
| Home Page | Project Dashboard | Team Finder |
|-----------|-------------------|-------------|
| ![Home](assets/images/screenshot-home.png) | ![Dashboard](assets/images/screenshot-dashboard.png) | ![Teams](assets/images/screenshot-teams.png) |

## 🛠️ Tech Stack
**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + Shadcn/ui
- Zustand (State Management)
- React Query (Data Fetching)
- Socket.io Client (Real-time)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Redis (Caching & Sessions)
- Socket.io Server

**DevOps & Tools:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Vercel/Heroku (Deployment)
- Jest + React Testing Library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/synapseflow.git
cd synapseflow

# Install dependencies
npm run setup  # Runs both client and server installs

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev   # Starts both frontend and backend
Alternative: Docker
bash
docker-compose up --build
📁 Project Structure
text
synapseflow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # State management
│   │   ├── utils/         # Helper functions
│   │   └── types/         # TypeScript definitions
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── sockets/       # Socket.io handlers
├── docs/                   # Documentation
└── tests/                  # Test suites
🔧 Configuration
Create a .env file in the root directory:

env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/synapseflow
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRY=7d

# Client
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
📡 API Endpoints
Method	Endpoint	Description	Auth Required
POST	/api/auth/register	Register new user	No
POST	/api/auth/login	User login	No
GET	/api/auth/me	Get current user	Yes
GET	/api/projects	List all projects	No
POST	/api/projects	Create project	Yes
GET	/api/projects/:id	Get project details	No
GET	/api/teams	Find teams	No
POST	/api/teams	Create team	Yes
POST	/api/teams/:id/join	Request to join team	Yes
🧪 Running Tests
bash
# Run all tests
npm test

# Run frontend tests only
npm run test:client

# Run backend tests only
npm run test:server

# Run tests with coverage
npm run test:coverage
🐳 Docker Deployment
bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add some AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open a Pull Request

👥 Team
Alex Chen - Full Stack Developer & Team Lead

Sam Rodriguez - UI/UX Designer & Frontend Specialist

Jordan Lee - Backend Engineer & DevOps

Taylor Smith - Data Specialist & QA

🙏 Acknowledgments
CodeSpring Hackathon organizers

Mentors and judges

Open source libraries used in this project

All participants for the inspiration

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

📬 Contact
For questions or feedback:

Project Link: https://github.com/your-username/synapseflow

Issue Tracker: GitHub Issues

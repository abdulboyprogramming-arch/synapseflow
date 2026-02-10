import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Bell, User, LogOut, Settings, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Button from './Button'
import Avatar from './Avatar'
import Dropdown from './Dropdown'
import Badge from './Badge'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { label: 'Projects', href: '/projects' },
    { label: 'Teams', href: '/teams' },
    { label: 'Dashboard', href: '/dashboard', protected: true },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-dark-800 bg-dark-900/90 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg group-hover:shadow-glow transition-shadow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SynapseFlow</h1>
              <p className="text-xs text-gray-500">CodeSpring Hackathon</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              if (link.protected && !user) return null
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-gray-400 hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <Badge variant="danger" size="sm" className="absolute -top-1 -right-1">
                    3
                  </Badge>
                </button>

                <Dropdown
                  trigger={
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <span className="hidden md:inline text-sm font-medium">
                        {user.name.split(' ')[0]}
                      </span>
                    </button>
                  }
                >
                  <Dropdown.Item>
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Dropdown.Item>
                  <Dropdown.Separator />
                  <Dropdown.Item onClick={handleLogout} className="text-red-400">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Dropdown.Item>
                </Dropdown>

                <Link to="/submit">
                  <Button variant="primary" size="sm">
                    Submit Project
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-dark-800 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => {
                if (link.protected && !user) return null
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

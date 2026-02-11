import React from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'

const Header: React.FC = () => {
  return (
    <header className="relative z-20 backdrop-blur-md bg-dark-900/60 border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold gradient-text">
          SynapseFlow
        </Link>

        <div className="flex gap-4">
          <Link to="/projects">
            <Button variant="ghost">Projects</Button>
          </Link>
          <Link to="/teams">
            <Button variant="ghost">Teams</Button>
          </Link>
          <Link to="/login">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header

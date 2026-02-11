import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'bg-dark-900/70 backdrop-blur-md border border-dark-700 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-500',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card

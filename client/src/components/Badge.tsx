import React from 'react'
import clsx from 'clsx'

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'outline'

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-purple-600 text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-black',
  outline: 'border border-gray-400 text-gray-700 bg-transparent',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge

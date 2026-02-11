import React from 'react'

interface AvatarProps {
  src?: string
  name?: string
  size?: number
}

const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 40 }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default Avatar

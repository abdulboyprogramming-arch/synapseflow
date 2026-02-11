import React from 'react'

interface ProgressBarProps {
  value: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-blue-600 h-3 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default ProgressBar

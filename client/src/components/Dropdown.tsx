import React, { useState } from 'react'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg z-50 p-2">
          {children}
        </div>
      )}
    </div>
  )
}

export default Dropdown

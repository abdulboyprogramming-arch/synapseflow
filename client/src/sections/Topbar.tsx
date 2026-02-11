import { Sun, Moon } from "lucide-react"
import { useState } from "react"

export default function Topbar() {
  const [dark, setDark] = useState(true)

  function toggle() {
    setDark(!dark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className="h-16 flex justify-end items-center px-6 border-b border-dark-800">
      <button onClick={toggle} className="p-2 rounded-lg hover:bg-dark-800">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  )
}

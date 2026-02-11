import { LayoutDashboard, MessageSquare, Settings } from "lucide-react"
import { NavLink } from "react-router-dom"

const linkStyle = "flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-dark-800 transition"

export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-800 p-6">
      <h1 className="text-2xl font-bold gradient-text mb-10">
        SYNAPSEFLOW
      </h1>
      <nav className="flex flex-col gap-2">
        <NavLink to="/" className={linkStyle}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/chat" className={linkStyle}>
          <MessageSquare size={18} /> AI Chat
        </NavLink>
        <NavLink to="/settings" className={linkStyle}>
          <Settings size={18} /> Settings
        </NavLink>
      </nav>
    </aside>
  )
}

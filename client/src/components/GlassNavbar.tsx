import { Cpu } from "lucide-react"

export default function GlassNavbar() {
  return (
    <div className="fixed top-0 w-full backdrop-blur-xl bg-dark-900/60 border-b border-dark-700 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl gradient-text">
          <Cpu size={22} />
          SYNAPSEFLOW
        </div>
        <div className="text-sm text-gray-400">
          AI Collaboration Platform
        </div>
      </div>
    </div>
  )
}

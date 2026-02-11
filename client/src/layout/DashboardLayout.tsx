import { ReactNode } from "react"
import Sidebar from "../sections/Sidebar"
import Topbar from "../sections/Topbar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-dark-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}

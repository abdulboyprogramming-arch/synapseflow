import Card from "../components/Card"
import { motion } from "framer-motion"
import Background from "../components/Particles/Background"

export default function Dashboard() {
  const stats = [
    { title: "Active Projects", value: 12 },
    { title: "AI Sessions", value: 58 },
    { title: "Collaboration Score", value: "94%" },
  ]

  return (
    <div className="relative min-h-[80vh]">
      <Background />
      <motion.div
        className="grid md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:scale-105 transition-transform duration-500">
            <h2 className="text-lg font-semibold mb-2">{stat.title}</h2>
            <p className="text-3xl font-bold gradient-text animate-float">{stat.value}</p>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}

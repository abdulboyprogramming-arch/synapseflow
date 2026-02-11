import { motion } from "framer-motion"

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="absolute w-[800px] h-[800px] bg-primary-600/20 rounded-full blur-3xl top-[-200px] left-[-200px]"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
        className="absolute w-[700px] h-[700px] bg-secondary-600/20 rounded-full blur-3xl bottom-[-200px] right-[-200px]"
      />
    </div>
  )
}

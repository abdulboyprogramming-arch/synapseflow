import { motion } from "framer-motion"
import Button from "./Button"

export default function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-7xl font-extrabold gradient-text mb-6"
      >
        Build. Collaborate. Dominate.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl text-gray-400 mb-10 text-lg"
      >
        Next-generation AI collaboration system engineered for creators,
        builders and innovators.
      </motion.p>

      <Button>Launch Dashboard</Button>
    </section>
  )
}

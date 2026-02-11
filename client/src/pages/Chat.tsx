import { useState } from "react"
import Button from "../components/Button"
import Card from "../components/Card"
import { motion } from "framer-motion"
import Background from "../components/Particles/Background"

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState("")

  function send() {
    if (!input) return
    setMessages([...messages, input])
    setInput("")
  }

  return (
    <div className="relative min-h-[80vh]">
      <Background />
      <Card className="max-w-3xl mx-auto mt-6">
        <div className="h-[500px] overflow-y-auto mb-4 space-y-3">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              className="bg-dark-800 p-3 rounded-xl"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {m}
            </motion.div>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 input"
            placeholder="Ask AI something..."
          />
          <Button onClick={send}>Send</Button>
        </div>
      </Card>
    </div>
  )
}

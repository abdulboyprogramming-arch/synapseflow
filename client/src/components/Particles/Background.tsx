import { useCallback } from "react"
import Particles from "react-tsparticles"
import type { Engine } from "tsparticles"
import { loadFull } from "tsparticles"

export default function Background() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine)
  }, [])

  return (
    <Particles
      className="absolute inset-0 -z-10"
      init={particlesInit}
      options={{
        fpsLimit: 60,
        interactivity: {
          events: { onHover: { enable: true, mode: "repulse" }, resize: true },
        },
        particles: {
          color: { value: ["#0ea5e9", "#d946ef"] },
          links: { enable: true, color: "#ffffff", distance: 150 },
          collisions: { enable: false },
          move: { enable: true, speed: 1 },
          number: { density: { enable: true, area: 800 }, value: 60 },
          opacity: { value: 0.3 },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 4 } },
        },
        detectRetina: true,
      }}
    />
  )
}

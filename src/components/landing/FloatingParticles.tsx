import { useMemo } from 'react'

interface Particle {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  opacity: number
}

export default function FloatingParticles({ count = 28 }: { count?: number }) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 5 + 2,
        duration: Math.random() * 18 + 14,
        delay: -Math.random() * 32,
        opacity: Math.random() * 0.35 + 0.12,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-up ${p.duration}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  )
}

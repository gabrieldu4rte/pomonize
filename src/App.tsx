import type React from "react"
import { useState } from "react"
import PomodoroSelector from "./components/PomodoroSelector"
import PomodoroTimer from "./components/PomodoroTimer"
import PixelBackground from "./components/pixel/PixelBackground"
import PixelSprite from "./components/pixel/PixelSprite"
import { HEART, TOMATO } from "./components/pixel/sprites"
import type { PomodoroType } from "./pomodoroConfig"

const App: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<PomodoroType | null>(null)
  const [typeName, setTypeName] = useState<string>("")

  const handleSelection = (config: PomodoroType, name: string) => {
    setSelectedConfig(config)
    setTypeName(name)
  }

  const resetSelection = () => {
    setSelectedConfig(null)
    setTypeName("")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PixelBackground />

      <header className="pixel-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-center gap-4">
            <PixelSprite sprite={TOMATO} scale={3} className="anim-bob" />
            <h1 className="pixel-title text-2xl md:text-4xl">POMONIZE</h1>
            <PixelSprite sprite={TOMATO} scale={3} className="anim-bob hidden sm:block" />
          </div>
          <p className="text-center text-[#c2c3c7] mt-3 text-lg md:text-xl leading-tight">
            Boost your productivity with the Pomodoro Technique and get your tasks Pomonized!
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full max-w-md pixel-shadow">
          {!selectedConfig ? (
            <PomodoroSelector onSelect={handleSelection} />
          ) : (
            <PomodoroTimer config={selectedConfig} onResetSelection={resetSelection} typeName={typeName} />
          )}
        </div>
      </main>

      <footer className="pixel-footer py-5">
        <div className="container mx-auto px-4">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[#c2c3c7] text-lg">
            <span>© Made with</span>
            <PixelSprite sprite={HEART} scale={2} title="love" />
            <span>by</span>
            <a
              href="https://github.com/gabrieldu4rte"
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-link"
            >
              Gabriel Duarte (alesred)
            </a>
            <span>| 2025 Pomonize. All rights reserved.</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

import type React from "react"
import { pomodoroSettings, type PomodoroType } from "../pomodoroConfig"
import { playUiSound } from "../utils/audioUtils"
import PixelSprite from "./pixel/PixelSprite"
import { ARROW_RIGHT, BULB, CLOCK, LIGHTNING, ROBOT, TOMATO, type Sprite } from "./pixel/sprites"

interface PomodoroSelectorProps {
  onSelect: (type: PomodoroType, typeName: string) => void
}

const PomodoroSelector: React.FC<PomodoroSelectorProps> = ({ onSelect }) => {
  const handleSelect = (key: string) => {
    playUiSound("select")
    onSelect(pomodoroSettings[key], key)
  }

  const getButtonStyle = (key: string) => {
    const styles = {
      light: "btn-green",
      mid: "btn-blue",
      classic: "btn-purple",
      hardcore: "btn-red",
    }
    return styles[key as keyof typeof styles] || styles.classic
  }

  const getIcon = (key: string): Sprite => {
    const icons = {
      classic: TOMATO,
      light: LIGHTNING,
      mid: CLOCK,
      hardcore: ROBOT,
    }
    return icons[key as keyof typeof icons] || TOMATO
  }

  const getDescription = (key: string) => {
    const config = pomodoroSettings[key]
    return `${config.workDuration}min work, ${config.shortBreak}min break`
  }

  return (
    <div className="pixel-frame pixel-panel p-5 md:p-7">
      <div className="text-center mb-6">
        <h2 className="font-pixel text-base md:text-lg leading-relaxed text-[#1d2b53] mb-3">Choose Your Pomodoro Style</h2>
        <p className="text-xl text-[#5f574f] leading-tight">Select the perfect timing for your productivity session</p>
      </div>

      <div className="space-y-3">
        {Object.keys(pomodoroSettings).map((key) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            className={`pixel-frame pixel-btn ${getButtonStyle(key)} group w-full p-4 md:p-5 flex items-center justify-between text-left`}
          >
            <div className="flex items-center gap-4">
              <span className="pixel-frame pixel-inset w-14 h-14 flex items-center justify-center shrink-0">
                <PixelSprite sprite={getIcon(key)} scale={3} />
              </span>
              <div>
                <div className="text-xs md:text-sm">Pomo {key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div className="font-retro text-xl leading-none mt-2 opacity-90" style={{ textShadow: "none" }}>
                  {getDescription(key)}
                </div>
              </div>
            </div>
            <PixelSprite sprite={ARROW_RIGHT} scale={3} className="group-hover-nudge shrink-0" />
          </button>
        ))}
      </div>

      <div className="pixel-frame pixel-inset mt-6 p-3 flex items-center gap-3">
        <PixelSprite sprite={BULB} scale={3} className="shrink-0 anim-bob" />
        <p className="text-lg leading-tight text-[#7e2553]">
          <strong className="font-pixel text-[10px] mr-1">TIP:</strong> The Pomodoro Technique helps you stay focused by
          breaking work into intervals
        </p>
      </div>
    </div>
  )
}

export default PomodoroSelector

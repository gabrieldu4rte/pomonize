import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { PomodoroType } from "../pomodoroConfig"
import { playPhaseTransitionSound, requestAudioPermission } from "../utils/audioUtils"

type Phase = "work" | "shortBreak" | "longBreak"

interface PomodoroTimerProps {
  config: PomodoroType
  onResetSelection: () => void
  typeName: string
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ config, onResetSelection, typeName }) => {
  const [phase, setPhase] = useState<Phase>("work")
  const [cycle, setCycle] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(config.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const previousPhaseRef = useRef<Phase>("work")

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRunning) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRunning])

  useEffect(() => {
    if (secondsLeft === 0) {
      let newPhase: Phase
      
      if (phase === "work") {
        if (cycle < config.cycles - 1) {
          newPhase = "shortBreak"
          setPhase("shortBreak")
          setSecondsLeft(config.shortBreak * 60)
        } else {
          newPhase = "longBreak"
          setPhase("longBreak")
          setSecondsLeft(config.longBreak * 60)
        }
      } else {
        if (phase === "longBreak") {
          setCycle(0)
        } else if (phase === "shortBreak") {
          setCycle(cycle + 1)
        }
        newPhase = "work"
        setPhase("work")
        setSecondsLeft(config.workDuration * 60)
      }

      if (audioEnabled && previousPhaseRef.current !== newPhase) {
        playPhaseTransitionSound(newPhase)
      }
      previousPhaseRef.current = newPhase
    }
  }, [secondsLeft, phase, cycle, config, audioEnabled])

  useEffect(() => {
    if (isRunning && !audioEnabled) {
      requestAudioPermission().then(setAudioEnabled)
    }
  }, [isRunning, audioEnabled])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const toggleAudio = async () => {
    if (!audioEnabled) {
      const permission = await requestAudioPermission()
      if (permission) {
        setAudioEnabled(true)
        setTimeout(() => playPhaseTransitionSound('work'), 100)
      }
    } else {
      setAudioEnabled(false)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setPhase("work")
    setCycle(0)
    setSecondsLeft(config.workDuration * 60)
  }

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = secs % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getPhaseInfo = () => {
    switch (phase) {
      case "work":
        return { name: "Focus Time", icon: "🎯", color: "rose" }
      case "shortBreak":
        return { name: "Short Break", icon: "☕", color: "blue" }
      case "longBreak":
        return { name: "Long Break", icon: "🌟", color: "purple" }
    }
  }

  const phaseInfo = getPhaseInfo()
  const progress = ((config.workDuration * 60 - secondsLeft) / (config.workDuration * 60)) * 100

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-rose-100">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          Pomodoro {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
        </h2>
        <div className="flex items-center justify-center space-x-2 text-lg">
          <span className="text-2xl">{phaseInfo.icon}</span>
          <span className={`font-semibold text-${phaseInfo.color}-600`}>{phaseInfo.name}</span>
        </div>
      </div>

      <div className="relative w-48 h-48 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-200" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={`text-${phaseInfo.color}-500 transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-mono font-bold text-gray-800">{formatTime(secondsLeft)}</div>
            <div className="text-sm text-gray-500 mt-1">
              Cycle {cycle + 1} of {config.cycles}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={toggleTimer}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 
            transform hover:scale-105 active:scale-95 ${
              isRunning
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            }`}
        >
          {isRunning ? "⏸️ Pause" : "▶️ Start"}
        </button>

        <button
          onClick={resetTimer}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 
            transform hover:scale-105 active:scale-95 bg-gradient-to-r from-gray-500 to-gray-600 
            hover:from-gray-600 hover:to-gray-700 text-white"
        >
          🔄 Reset
        </button>
      </div>

      <div className="flex items-center justify-center mb-6">
        <button
          onClick={toggleAudio}
          className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 
            transform hover:scale-105 active:scale-95 ${
              audioEnabled
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
        >
          <span className="text-lg">{audioEnabled ? "🔊" : "🔇"}</span>
          <span>Audio Alerts</span>
        </button>
      </div>

      <button
        onClick={onResetSelection}
        className="w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 
          transform hover:scale-105 active:scale-95 bg-gradient-to-r from-orange-500 to-orange-600 
          hover:from-orange-600 hover:to-orange-700 text-white"
      >
        ← Change Pomo Type
      </button>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800">{config.workDuration}</div>
            <div className="text-xs text-gray-500">Work (min)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{config.shortBreak}</div>
            <div className="text-xs text-gray-500">Break (min)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{config.cycles}</div>
            <div className="text-xs text-gray-500">Cycles</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PomodoroTimer

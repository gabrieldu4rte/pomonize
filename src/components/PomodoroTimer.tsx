import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import type { PomodoroType } from "../pomodoroConfig"
import {
  isSoundEnabled,
  playPhaseTransitionSound,
  playUiSound,
  requestAudioPermission,
  setSoundEnabled,
} from "../utils/audioUtils"
import PixelDigits from "./pixel/PixelDigits"
import PixelSprite from "./pixel/PixelSprite"
import {
  ARROW_LEFT,
  COFFEE,
  PAUSE,
  PLAY,
  RESET,
  SPEAKER_OFF,
  SPEAKER_ON,
  STAR,
  TARGET,
  TOMATO,
} from "./pixel/sprites"

type Phase = "work" | "shortBreak" | "longBreak"

interface PomodoroTimerProps {
  config: PomodoroType
  onResetSelection: () => void
  typeName: string
}

const PROGRESS_CELLS = 20

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ config, onResetSelection, typeName }) => {
  const [phase, setPhase] = useState<Phase>("work")
  const [cycle, setCycle] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(config.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(isSoundEnabled)
  const [segment, setSegment] = useState(0)
  const [transitions, setTransitions] = useState(0)

  const endAtRef = useRef(0)
  const remainingMsRef = useRef(config.workDuration * 60 * 1000)
  const lastBeepRef = useRef("")

  const durationFor = useCallback(
    (p: Phase) => (p === "work" ? config.workDuration : p === "shortBreak" ? config.shortBreak : config.longBreak) * 60,
    [config],
  )

  useEffect(() => {
    if (!isRunning) return
    endAtRef.current = Date.now() + remainingMsRef.current
    const tick = () => {
      const remainingMs = Math.max(0, endAtRef.current - Date.now())
      setSecondsLeft(Math.ceil(remainingMs / 1000))
    }
    const timer = setInterval(tick, 250)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [isRunning, segment])

  useEffect(() => {
    if (secondsLeft > 0) return

    let newPhase: Phase
    if (phase === "work") {
      newPhase = cycle < config.cycles - 1 ? "shortBreak" : "longBreak"
    } else {
      newPhase = "work"
      setCycle(phase === "longBreak" ? 0 : cycle + 1)
    }

    const duration = durationFor(newPhase)
    remainingMsRef.current = duration * 1000
    endAtRef.current = Date.now() + duration * 1000
    setPhase(newPhase)
    setSecondsLeft(duration)
    setSegment((s) => s + 1)
    setTransitions((t) => t + 1)

    if (audioEnabled) {
      playPhaseTransitionSound(newPhase)
    }
  }, [secondsLeft, phase, cycle, config, audioEnabled, durationFor])

  useEffect(() => {
    const beepKey = `${segment}-${secondsLeft}`
    if (isRunning && audioEnabled && secondsLeft > 0 && secondsLeft <= 3 && lastBeepRef.current !== beepKey) {
      lastBeepRef.current = beepKey
      playUiSound("tick")
    }
  }, [secondsLeft, segment, isRunning, audioEnabled])

  const toggleTimer = () => {
    if (isRunning) {
      remainingMsRef.current = Math.max(0, endAtRef.current - Date.now())
      playUiSound("pause")
    } else {
      requestAudioPermission()
      playUiSound("start")
    }
    setIsRunning(!isRunning)
  }

  const toggleAudio = async () => {
    if (!audioEnabled) {
      const permission = await requestAudioPermission()
      if (permission) {
        setSoundEnabled(true)
        setAudioEnabled(true)
        playUiSound("toggleOn")
      }
    } else {
      setSoundEnabled(false)
      setAudioEnabled(false)
    }
  }

  const resetTimer = () => {
    playUiSound("reset")
    setIsRunning(false)
    setPhase("work")
    setCycle(0)
    setSecondsLeft(config.workDuration * 60)
    remainingMsRef.current = config.workDuration * 60 * 1000
    setSegment((s) => s + 1)
  }

  const handleChangeType = () => {
    playUiSound("back")
    onResetSelection()
  }

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = secs % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getPhaseInfo = () => {
    switch (phase) {
      case "work":
        return { name: "Focus Time", icon: TARGET, color: "#FF004D", shadow: "#7E2553" }
      case "shortBreak":
        return { name: "Short Break", icon: COFFEE, color: "#29ADFF", shadow: "#065AB5" }
      case "longBreak":
        return { name: "Long Break", icon: STAR, color: "#FFEC27", shadow: "#AB5236" }
    }
  }

  const phaseInfo = getPhaseInfo()
  const totalSeconds = durationFor(phase)
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const filledCells = Math.round(progress * PROGRESS_CELLS)
  const completedPomos = cycle + (phase === "work" ? 0 : 1)
  const timeText = formatTime(secondsLeft)

  return (
    <div className="pixel-frame pixel-panel p-5 md:p-7">
      <div className="text-center mb-5">
        <h2 className="font-pixel text-sm md:text-base text-[#1d2b53] mb-3">
          Pomodoro {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
        </h2>
        <div className="flex items-center justify-center gap-3">
          <PixelSprite sprite={phaseInfo.icon} scale={3} className={isRunning ? "anim-bob" : undefined} />
          <span className="font-pixel text-xs md:text-sm" style={{ color: phaseInfo.shadow }} data-testid="phase-name">
            {phaseInfo.name}
          </span>
        </div>
      </div>

      <div
        key={transitions}
        className={`pixel-frame pixel-screen px-4 py-5 mb-5 ${transitions > 0 ? "anim-flash" : ""}`}
      >
        <div
          role="timer"
          aria-label={`${timeText} remaining`}
          className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
        >
          <PixelDigits
            text={timeText}
            color={phaseInfo.color}
            shadowColor={phaseInfo.shadow}
            scale={8}
            dimColon={isRunning && secondsLeft % 2 === 1}
          />
        </div>

        <div className="flex gap-[2px] mt-4" aria-hidden>
          {Array.from({ length: PROGRESS_CELLS }, (_, i) => (
            <div
              key={i}
              className="progress-cell"
              style={i < filledCells ? { background: phaseInfo.color } : undefined}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="font-pixel text-[10px] text-[#c2c3c7]">
            Cycle {cycle + 1} of {config.cycles}
          </span>
          <div className="flex gap-1" aria-label={`${completedPomos} of ${config.cycles} pomodoros done`}>
            {Array.from({ length: config.cycles }, (_, i) => (
              <PixelSprite
                key={i}
                sprite={TOMATO}
                scale={2}
                mono={i < completedPomos || (i === cycle && phase === "work") ? undefined : "#2b2f4a"}
                className={i === cycle && phase === "work" && isRunning ? "anim-blink" : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <button
          onClick={toggleTimer}
          className={`pixel-frame pixel-btn ${isRunning ? "btn-red" : "btn-green"} flex-1 py-4 px-4 text-sm flex items-center justify-center gap-3`}
        >
          <PixelSprite sprite={isRunning ? PAUSE : PLAY} scale={2} />
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          onClick={resetTimer}
          className="pixel-frame pixel-btn btn-gray flex-1 py-4 px-4 text-sm flex items-center justify-center gap-3"
        >
          <PixelSprite sprite={RESET} scale={2} />
          Reset
        </button>
      </div>

      <div className="flex items-center justify-center mb-3">
        <button
          onClick={toggleAudio}
          aria-pressed={audioEnabled}
          className={`pixel-frame pixel-btn ${audioEnabled ? "btn-blue" : "btn-gray"} py-3 px-4 text-[10px] flex items-center gap-3`}
        >
          <PixelSprite sprite={audioEnabled ? SPEAKER_ON : SPEAKER_OFF} scale={2} />
          <span>Audio Alerts {audioEnabled ? "On" : "Off"}</span>
        </button>
      </div>

      <button
        onClick={handleChangeType}
        className="pixel-frame pixel-btn btn-orange w-full py-4 px-4 text-xs flex items-center justify-center gap-3"
      >
        <PixelSprite sprite={ARROW_LEFT} scale={2} />
        Change Pomo Type
      </button>

      <div className="pixel-frame pixel-inset mt-5 p-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { value: config.workDuration, label: "Work (min)" },
            { value: config.shortBreak, label: "Break (min)" },
            { value: config.longBreak, label: "Long (min)" },
            { value: config.cycles, label: "Cycles" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="font-pixel text-base text-[#1d2b53]">{value}</div>
              <div className="text-base leading-tight text-[#7e2553] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PomodoroTimer

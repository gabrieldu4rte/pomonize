type Phase = "work" | "shortBreak" | "longBreak"
type Wave = "pulse12" | "pulse25" | "pulse50" | "triangle" | "noise"
export type UiSound = "select" | "start" | "pause" | "reset" | "back" | "toggleOn" | "tick"

interface Note {
  note: string | number | null
  beats: number
  slideTo?: string | number
}

interface Track {
  wave: Wave
  volume: number
  notes: Note[]
}

const STORAGE_KEY = "pomonize:sound"

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
const pulseWaves = new Map<number, PeriodicWave>()

const getAudioContextClass = (): typeof AudioContext | undefined =>
  typeof window === "undefined" ? undefined : window.AudioContext || (window as any).webkitAudioContext

const getContext = (): AudioContext | null => {
  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) return null
  if (!audioContext) {
    audioContext = new AudioContextClass()
    masterGain = audioContext.createGain()
    masterGain.gain.value = 0.22
    masterGain.connect(audioContext.destination)
  }
  return audioContext
}

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const toFrequency = (note: string | number): number => {
  if (typeof note === "number") return note
  const match = /^([A-G])(#|b)?(\d)$/.exec(note)
  if (!match) return 440
  const [, letter, accidental, octave] = match
  const semitone = NOTE_INDEX[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0)
  const midi = (Number(octave) + 1) * 12 + semitone
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const getPulseWave = (ctx: AudioContext, duty: number) => {
  const cached = pulseWaves.get(duty)
  if (cached) return cached
  const harmonics = 64
  const real = new Float32Array(harmonics)
  const imag = new Float32Array(harmonics)
  for (let n = 1; n < harmonics; n++) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty)
  }
  const wave = ctx.createPeriodicWave(real, imag)
  pulseWaves.set(duty, wave)
  return wave
}

const getNoiseBuffer = (ctx: AudioContext) => {
  if (noiseBuffer) return noiseBuffer
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  let value = 1
  for (let i = 0; i < data.length; i++) {
    if (i % 4 === 0) value = Math.random() > 0.5 ? 1 : -1
    data[i] = value
  }
  return noiseBuffer
}

const playTone = (ctx: AudioContext, wave: Wave, note: Note, start: number, duration: number, volume: number) => {
  if (note.note === null || !masterGain) return
  const gain = ctx.createGain()
  gain.connect(masterGain)

  const end = start + duration
  gain.gain.setValueAtTime(volume, start)
  gain.gain.setValueAtTime(volume * 0.75, start + Math.min(0.04, duration * 0.3))
  gain.gain.setValueAtTime(volume * 0.55, start + Math.min(0.1, duration * 0.6))
  gain.gain.setValueAtTime(volume * 0.55, Math.max(start, end - 0.02))
  gain.gain.linearRampToValueAtTime(0, end)

  if (wave === "noise") {
    const source = ctx.createBufferSource()
    source.buffer = getNoiseBuffer(ctx)
    source.loop = true
    source.playbackRate.value = Math.min(4, toFrequency(note.note) / 440)
    source.connect(gain)
    source.start(start)
    source.stop(end)
    return
  }

  const osc = ctx.createOscillator()
  if (wave === "triangle") {
    osc.type = "triangle"
  } else {
    osc.setPeriodicWave(getPulseWave(ctx, wave === "pulse12" ? 0.125 : wave === "pulse25" ? 0.25 : 0.5))
  }
  osc.frequency.setValueAtTime(toFrequency(note.note), start)
  if (note.slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(toFrequency(note.slideTo), end)
  }
  osc.connect(gain)
  osc.start(start)
  osc.stop(end + 0.01)
}

const playSong = (tracks: Track[], bpm: number) => {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === "suspended") ctx.resume().catch(() => undefined)

  const beat = 60 / bpm
  const startAt = ctx.currentTime + 0.03
  tracks.forEach((track) => {
    let time = startAt
    track.notes.forEach((note) => {
      const duration = note.beats * beat
      playTone(ctx, track.wave, note, time, duration * 0.92, track.volume)
      time += duration
    })
  })
}

const seq = (pattern: string): Note[] =>
  pattern
    .trim()
    .split(/\s+/)
    .map((token) => {
      const [pitch, beats = "1"] = token.split(":")
      const [from, to] = pitch.split(">")
      return { note: from === "-" ? null : from, beats: Number(beats), slideTo: to }
    })

const PHASE_SONGS: Record<Phase, { bpm: number; tracks: Track[] }> = {
  work: {
    bpm: 300,
    tracks: [
      { wave: "pulse25", volume: 0.5, notes: seq("C5:1 E5:1 G5:1 C6:1 E5:1 G5:1 C6:1 E6:1 G6:4") },
      { wave: "pulse12", volume: 0.25, notes: seq("-:1 C5:1 E5:1 G5:1 C5:1 E5:1 G5:1 C6:1 E6:4") },
      { wave: "triangle", volume: 0.6, notes: seq("C3:2 G3:2 C4:2 G3:2 C3:4") },
    ],
  },
  shortBreak: {
    bpm: 240,
    tracks: [
      { wave: "pulse50", volume: 0.4, notes: seq("B5:0.5 E6:2.5 -:0.5 G5:1 E5:1 C5:3") },
      { wave: "triangle", volume: 0.5, notes: seq("-:3.5 C4:1 G3:1 C3:3") },
    ],
  },
  longBreak: {
    bpm: 400,
    tracks: [
      { wave: "pulse25", volume: 0.5, notes: seq("G4:1 C5:1 E5:1 G5:1 C6:1 E6:1 G6:3 E6:3 G#4:1 C5:1 D#5:1 G#5:1 C6:1 D#6:1 G#6:3 D#6:3 A#4:1 D5:1 F5:1 A#5:1 D6:1 F6:1 A#6:3 A#6:1 A#6:1 A#6:1 C7:6") },
      { wave: "pulse12", volume: 0.25, notes: seq("E4:1 G4:1 C5:1 E5:1 G5:1 C6:1 E6:6 D#4:1 G#4:1 C5:1 D#5:1 G#5:1 C6:1 D#6:6 F4:1 A#4:1 D5:1 F5:1 A#5:1 D6:1 F6:3 F6:1 F6:1 F6:1 G6:6") },
      { wave: "triangle", volume: 0.6, notes: seq("C3:6 C3:6 G#2:6 G#2:6 A#2:6 A#2:3 A#2:1 A#2:1 A#2:1 C3:6") },
      { wave: "noise", volume: 0.12, notes: seq(`${"C6:0.5 -:2.5 ".repeat(11)}C6:0.5 -:0.5 C6:0.5 -:0.5 C6:0.5 -:0.5 C6:3`) },
    ],
  },
}

const UI_SONGS: Record<UiSound, { bpm: number; tracks: Track[] }> = {
  select: { bpm: 600, tracks: [{ wave: "pulse25", volume: 0.4, notes: seq("E6:1 B6:2") }] },
  start: { bpm: 600, tracks: [{ wave: "pulse50", volume: 0.35, notes: seq("C5>C6:3 G5:1 C6:2") }] },
  pause: { bpm: 600, tracks: [{ wave: "pulse50", volume: 0.35, notes: seq("C6:1 G5:1 C5:3") }] },
  reset: {
    bpm: 600,
    tracks: [
      { wave: "pulse25", volume: 0.35, notes: seq("G5:1 E5:1 C5:1 G4:3") },
      { wave: "noise", volume: 0.1, notes: seq("C7>C5:3") },
    ],
  },
  back: { bpm: 600, tracks: [{ wave: "pulse25", volume: 0.4, notes: seq("B5:1 E5:2") }] },
  toggleOn: { bpm: 480, tracks: [{ wave: "pulse25", volume: 0.4, notes: seq("C5:1 E5:1 G5:1 C6:2") }] },
  tick: { bpm: 600, tracks: [{ wave: "pulse50", volume: 0.3, notes: seq("A5:2") }] },
}

export const playPhaseTransitionSound = (phase: Phase) => {
  const song = PHASE_SONGS[phase]
  playSong(song.tracks, song.bpm)
}

export const playUiSound = (sound: UiSound) => {
  if (!isSoundEnabled()) return
  const song = UI_SONGS[sound]
  playSong(song.tracks, song.bpm)
}

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    return true
  }
}

export const setSoundEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
  } catch {
  }
}

export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    const ctx = getContext()
    if (!ctx) return false
    if (ctx.state === "suspended") {
      await ctx.resume()
    }
    return true
  } catch (error) {
    console.warn("Audio permission denied or not available:", error)
    return false
  }
}

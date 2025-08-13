export const playPhaseTransitionSound = (phase: 'work' | 'shortBreak' | 'longBreak') => {
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    console.warn('Web Audio API not supported')
    return
  }

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  const audioContext = new AudioContext()

  const playBeep = (frequency: number, duration: number, delay: number = 0, waveType: OscillatorType = 'square') => {

    const oscillator1 = audioContext.createOscillator()
    const oscillator2 = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator1.frequency.setValueAtTime(frequency, audioContext.currentTime + delay)
    oscillator1.type = waveType

    oscillator2.frequency.setValueAtTime(frequency * 1.01, audioContext.currentTime + delay)
    oscillator2.type = 'sine'

    gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay)
    gainNode.gain.linearRampToValueAtTime(0.9, audioContext.currentTime + delay + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration)

    oscillator1.start(audioContext.currentTime + delay)
    oscillator1.stop(audioContext.currentTime + delay + duration)
    oscillator2.start(audioContext.currentTime + delay)
    oscillator2.stop(audioContext.currentTime + delay + duration)
  }

  switch (phase) {
    case 'work':
      playBeep(600, 0.15, 0, 'square')
      playBeep(800, 0.15, 0.2, 'square')
      playBeep(1000, 0.25, 0.4, 'square')
      break
    case 'shortBreak':
      playBeep(700, 0.3, 0, 'triangle')
      playBeep(500, 0.4, 0.4, 'triangle')
      break
    case 'longBreak':
      playBeep(1200, 0.2, 0, 'sawtooth')
      playBeep(1000, 0.2, 0.25, 'sawtooth')
      playBeep(800, 0.2, 0.5, 'sawtooth')
      playBeep(600, 0.3, 0.75, 'sawtooth')
      break
  }
}

export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      return false
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    return true
  } catch (error) {
    console.warn('Audio permission denied or not available:', error)
    return false
  }
}
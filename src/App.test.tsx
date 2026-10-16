import { act, fireEvent, render, screen } from "@testing-library/react"
import App from "./App"

const timeLeft = () => screen.getByRole("timer").getAttribute("aria-label")
const phaseName = () => screen.getByTestId("phase-name").textContent

const advance = (seconds: number) => {
  // Step in small chunks so React flushes each phase transition
  for (let i = 0; i < seconds * 4; i++) {
    act(() => {
      jest.advanceTimersByTime(250)
    })
  }
}

beforeEach(() => {
  jest.useFakeTimers()
  localStorage.clear()
})

afterEach(() => {
  jest.useRealTimers()
})

test("shows the four pomodoro modes", () => {
  render(<App />)
  expect(screen.getByText(/choose your pomodoro style/i)).toBeInTheDocument()
  for (const mode of ["Light", "Mid", "Classic", "Hardcore"]) {
    expect(screen.getByText(`Pomo ${mode}`)).toBeInTheDocument()
  }
})

test("selecting a mode opens the timer and change type goes back", () => {
  render(<App />)
  fireEvent.click(screen.getByText("Pomo Classic"))
  expect(screen.getByText("Pomodoro Classic")).toBeInTheDocument()
  expect(timeLeft()).toBe("25:00 remaining")
  expect(phaseName()).toBe("Focus Time")

  fireEvent.click(screen.getByText(/change pomo type/i))
  expect(screen.getByText(/choose your pomodoro style/i)).toBeInTheDocument()
})

test("start, pause and reset", () => {
  render(<App />)
  fireEvent.click(screen.getByText("Pomo Light"))

  fireEvent.click(screen.getByText("Start"))
  advance(3)
  expect(timeLeft()).toBe("04:57 remaining")

  fireEvent.click(screen.getByText("Pause"))
  advance(10)
  expect(timeLeft()).toBe("04:57 remaining")

  fireEvent.click(screen.getByText("Start"))
  advance(2)
  expect(timeLeft()).toBe("04:55 remaining")

  fireEvent.click(screen.getByText("Reset"))
  expect(timeLeft()).toBe("05:00 remaining")
  expect(screen.getByText("Start")).toBeInTheDocument()
})

test("runs through every phase of a full cycle", () => {
  render(<App />)
  fireEvent.click(screen.getByText("Pomo Light")) // 5 work / 2 break / 10 long, 2 cycles
  fireEvent.click(screen.getByText("Start"))

  advance(5 * 60)
  expect(phaseName()).toBe("Short Break")
  expect(timeLeft()).toBe("02:00 remaining")
  expect(screen.getByText("Cycle 1 of 2")).toBeInTheDocument()

  advance(2 * 60)
  expect(phaseName()).toBe("Focus Time")
  expect(screen.getByText("Cycle 2 of 2")).toBeInTheDocument()

  advance(5 * 60)
  expect(phaseName()).toBe("Long Break")
  expect(timeLeft()).toBe("10:00 remaining")

  advance(10 * 60)
  expect(phaseName()).toBe("Focus Time")
  expect(screen.getByText("Cycle 1 of 2")).toBeInTheDocument()
  expect(timeLeft()).toBe("05:00 remaining")
})

test("audio toggle can be turned off while the timer runs and is remembered", async () => {
  render(<App />)
  fireEvent.click(screen.getByText("Pomo Mid"))
  fireEvent.click(screen.getByText("Start"))

  const toggle = screen.getByRole("button", { name: /audio alerts/i })
  expect(toggle).toHaveAttribute("aria-pressed", "true")

  await act(async () => {
    fireEvent.click(toggle)
  })
  advance(2)
  expect(toggle).toHaveAttribute("aria-pressed", "false")
  expect(localStorage.getItem("pomonize:sound")).toBe("off")
})

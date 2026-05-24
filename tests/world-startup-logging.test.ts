import { describe, expect, spyOn, test } from "bun:test"
import { World } from "../src"

describe("World startup diagnostics", () => {
  test("constructor is silent by default for optional subsystem startup", () => {
    const infoSpy = spyOn(console, "info").mockImplementation(() => {})

    try {
      new World({
        features: {
          rendering: "headless",
          communication: true,
          linguistics: true
        }
      })

      expect(infoSpy).toHaveBeenCalledTimes(0)
    } finally {
      infoSpy.mockRestore()
    }
  })

  test("startup diagnostics can be enabled explicitly", () => {
    const infoSpy = spyOn(console, "info").mockImplementation(() => {})

    try {
      new World({
        silent: false,
        features: {
          rendering: "headless",
          communication: true,
          linguistics: true
        }
      })

      expect(infoSpy).toHaveBeenCalled()
    } finally {
      infoSpy.mockRestore()
    }
  })
})

import { describe, expect, test } from "bun:test"
import { ProtoLanguageGenerator } from "../src/6-world/linguistics/proto-language"

function withRandomSequence<T>(values: number[], run: () => T): T {
  const originalRandom = Math.random
  let index = 0

  Math.random = () => values[Math.min(index++, values.length - 1)] ?? 0

  try {
    return run()
  } finally {
    Math.random = originalRandom
  }
}

describe("ProtoLanguageGenerator vocabulary selection", () => {
  test("samples from the full vocabulary pool instead of the first ten words", () => {
    const generator = new ProtoLanguageGenerator()
    const vocabularyPool = [
      "filler-0",
      "filler-1",
      "filler-2",
      "filler-3",
      "filler-4",
      "filler-5",
      "filler-6",
      "filler-7",
      "filler-8",
      "filler-9",
      "filler-10",
      "filler-11",
      "late-word"
    ]

    const phrase = withRandomSequence([0, 0.999], () => generator.generate({
      vocabularyPool,
      minWords: 1,
      maxWords: 1,
      allowParticles: false,
      allowEmoji: false,
      creativity: 0
    }))

    expect(phrase).toBe("late-word")
  })

  test("emotion ordering preserves tail vocabulary instead of truncating it", () => {
    const generator = new ProtoLanguageGenerator()
    const vocabularyPool = [
      "happy-seed",
      "good-seed",
      "love-seed",
      "yay-seed",
      ...Array.from({ length: 24 }, (_, index) => `neutral-${index}`),
      "tail-signal"
    ]

    const phrase = withRandomSequence([0, 0.999], () => generator.generate({
      vocabularyPool,
      emotion: { valence: 0.8, arousal: 0.2 },
      minWords: 1,
      maxWords: 1,
      allowParticles: false,
      allowEmoji: false,
      creativity: 0
    }))

    expect(phrase).toBe("tail-signal")
  })
})

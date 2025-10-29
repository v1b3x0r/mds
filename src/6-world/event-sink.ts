import type { World } from '@mds/6-world/container'
import type { WorldEvent, WorldContextEvent, WorldAnalyticsEvent } from '@mds/6-world/container'
import type { Utterance } from '@mds/6-world/linguistics/transcript'

export interface WorldEventSink {
  onContext?(event: WorldContextEvent): void
  onAnalytics?(event: WorldAnalyticsEvent): void
  onEvent?(event: WorldEvent): void
  onUtterance?(event: Utterance): void
  onTick?(event: { time: number; dt: number }): void
}

export class InMemoryWorldEventSink implements WorldEventSink {
  context: WorldContextEvent[] = []
  analytics: WorldAnalyticsEvent[] = []
  events: WorldEvent[] = []
  utterances: Utterance[] = []
  ticks: Array<{ time: number; dt: number }> = []

  onContext(event: WorldContextEvent): void {
    this.context.push(event)
  }

  onAnalytics(event: WorldAnalyticsEvent): void {
    this.analytics.push(event)
  }

  onEvent(event: WorldEvent): void {
    this.events.push(event)
  }

  onUtterance(event: Utterance): void {
    this.utterances.push(event)
  }

  onTick(event: { time: number; dt: number }): void {
    this.ticks.push(event)
  }
}

export function attachWorldEventSink(world: World, sink: WorldEventSink): () => void {
  const unsubscribers: Array<() => void> = []

  if (sink.onContext) {
    unsubscribers.push(world.on('context', (event) => sink.onContext?.(event)))
  }

  if (sink.onAnalytics) {
    unsubscribers.push(world.on('analytics', (event) => sink.onAnalytics?.(event)))
  }

  if (sink.onEvent) {
    unsubscribers.push(world.on('event', (event) => sink.onEvent?.(event)))
  }

  if (sink.onUtterance) {
    unsubscribers.push(world.on('utterance', (event) => sink.onUtterance?.(event)))
  }

  if (sink.onTick) {
    unsubscribers.push(world.on('tick', (event) => sink.onTick?.(event)))
  }

  return () => {
    for (const unsubscribe of unsubscribers) {
      try {
        unsubscribe()
      } catch (error) {
        console.error('[WorldEventSink] Failed to unsubscribe listener', error)
      }
    }
  }
}

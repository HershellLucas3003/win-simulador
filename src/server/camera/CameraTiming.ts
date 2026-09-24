import type { CameraTimingMode } from '../../shared/camera'

export interface AppearActions {
  enqueueFrame(): void
  captureImages(): Promise<void>
}

export type Deferrer = (delayMs: number, task: () => void) => void

export interface CameraTimingStrategy {
  run(actions: AppearActions, delayMs: number, defer: Deferrer): void
}

const ignoreFailure = (promise: Promise<void>) => {
  promise.catch(() => undefined)
}

const beforeFrame: CameraTimingStrategy = {
  run(actions, delayMs, defer) {
    ignoreFailure(actions.captureImages())
    defer(delayMs, () => actions.enqueueFrame())
  },
}

const afterFrame: CameraTimingStrategy = {
  run(actions, delayMs, defer) {
    actions.enqueueFrame()
    defer(delayMs, () => ignoreFailure(actions.captureImages()))
  },
}

const noImage: CameraTimingStrategy = {
  run(actions) {
    actions.enqueueFrame()
  },
}

const STRATEGIES: Record<CameraTimingMode, CameraTimingStrategy> = {
  'before-frame': beforeFrame,
  'after-frame': afterFrame,
  none: noImage,
}

export const timingStrategyFor = (mode: CameraTimingMode): CameraTimingStrategy => STRATEGIES[mode] ?? beforeFrame

export const timerDeferrer: Deferrer = (delayMs, task) => {
  if (delayMs <= 0) task()
  else setTimeout(task, delayMs)
}

interface SleepTimerOptions {
  getVolume: () => number;
  setVolume: (volume: number) => void;
  pause: () => void;
  onChange: (minutes: number | null) => void;
  now?: () => number;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  unschedule?: (handle: ReturnType<typeof setTimeout>) => void;
}

/** Absolute deadline avoids drift; fade and pause always operate on the current player. */
export class SleepTimer {
  private deadline: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private originalVolume: number | null = null;
  private readonly now;
  private readonly schedule;
  private readonly unschedule;

  constructor(private readonly options: SleepTimerOptions) {
    this.now = options.now || Date.now;
    this.schedule = options.schedule || setTimeout;
    this.unschedule = options.unschedule || clearTimeout;
  }

  start(minutes: number) {
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    this.cancel();
    this.deadline = this.now() + minutes * 60_000;
    this.refresh();
  }

  refresh = () => {
    this.clearScheduled();
    if (this.deadline === null) return;
    const remaining = this.deadline - this.now();
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60_000);
      this.options.onChange(minutes);
      this.timer = this.schedule(this.refresh, remaining - (minutes - 1) * 60_000);
      return;
    }
    this.options.onChange(0);
    if (this.originalVolume === null) this.originalVolume = this.options.getVolume();
    const fadeProgress = Math.min(1, Math.max(0, (this.now() - this.deadline) / 1500));
    if (fadeProgress < 1) {
      this.options.setVolume(this.originalVolume * (1 - fadeProgress));
      this.timer = this.schedule(this.refresh, 100);
      return;
    }
    this.options.pause();
    this.cancel();
  };

  cancel = () => {
    this.clearScheduled();
    this.deadline = null;
    if (this.originalVolume !== null) this.options.setVolume(this.originalVolume);
    this.originalVolume = null;
    this.options.onChange(null);
  };

  dispose() {
    this.clearScheduled();
    // Expo may already have released the native player during unmount.
    this.originalVolume = null;
    this.deadline = null;
  }

  private clearScheduled() {
    if (this.timer !== null) this.unschedule(this.timer);
    this.timer = null;
  }
}

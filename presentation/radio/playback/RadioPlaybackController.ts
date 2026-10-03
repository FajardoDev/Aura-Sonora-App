export const RADIO_PLAYBACK_ERROR =
  "No se pudo reproducir esta emisora. Intenta nuevamente.";

export interface RadioPlaybackState {
  isConnecting: boolean;
  playbackError: string | null;
  retryCount: number;
}

interface PlaybackStatus {
  playing: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  playbackState: string;
  currentTime: number;
}

interface RadioPlayer {
  readonly currentStatus: PlaybackStatus;
  pause(): void;
  play(): void;
  replace(source: string): void;
}

/** Controls one existing native player. Polling avoids consuming queued events
 * from the previous source (expo-audio status events contain no source ID).
 */
export class RadioPlaybackController {
  private source: string | null = null;
  private wanted = false;
  private disposed = false;
  private retryAt: number | null = null;
  private startedAt = 0;
  private progressAt = 0;
  private position = 0;
  private wasPlaying = false;
  private state: RadioPlaybackState = {
    isConnecting: false,
    playbackError: null,
    retryCount: 0,
  };

  constructor(
    private player: RadioPlayer,
    private publish: (state: RadioPlaybackState) => void,
    private setPlaying: (playing: boolean) => void,
    private now: () => number = Date.now,
  ) {}

  private update(patch: Partial<RadioPlaybackState>) {
    this.state = { ...this.state, ...patch };
    this.publish(this.state);
  }

  select(source: string | null, wanted: boolean) {
    if (!source && this.source) this.player.pause();
    this.source = source;
    this.wanted = wanted && !!source;
    this.retryAt = null;
    this.wasPlaying = false;
    this.update({ isConnecting: false, playbackError: null, retryCount: 0 });
    if (source) this.start(true);
  }

  request(wanted: boolean) {
    if (!this.source || this.disposed) return;
    this.wanted = wanted;
    this.retryAt = null;
    if (!wanted) {
      this.player.pause();
      this.setPlaying(false);
      this.update({ isConnecting: false });
    } else if (this.state.playbackError) {
      this.retry();
    } else {
      this.update({ retryCount: 0 });
      this.start(false);
    }
  }

  retry() {
    if (!this.source || this.disposed) return;
    this.wanted = true;
    this.retryAt = null;
    this.update({ playbackError: null, retryCount: 0 });
    this.start(true);
  }

  private start(replace: boolean) {
    this.startedAt = this.progressAt = this.now();
    this.position = 0;
    this.wasPlaying = false;
    this.update({ isConnecting: this.wanted, playbackError: null });
    if (this.wanted) this.setPlaying(false);
    try {
      if (!this.source || !/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(this.source)) {
        throw new Error("Invalid radio stream URL");
      }
      if (replace) {
        this.player.pause();
        this.player.replace(this.source);
      }
      if (this.wanted) this.player.play();
    } catch {
      if (this.wanted) this.fail();
    }
  }

  private fail() {
    // An error ends this attempt immediately, including the store's playing flag.
    try { this.player.pause(); } catch { /* Native source already failed. */ }
    this.setPlaying(false);
    if (this.state.retryCount < 2) {
      this.retryAt = this.now() + 1800;
      this.update({ isConnecting: true, retryCount: this.state.retryCount + 1 });
    } else {
      this.wanted = false;
      this.retryAt = null;
      this.update({ isConnecting: false, playbackError: RADIO_PLAYBACK_ERROR });
    }
  }

  tick() {
    if (this.disposed || !this.source) return;
    const now = this.now();
    if (this.retryAt !== null) {
      if (now >= this.retryAt) {
        this.retryAt = null;
        this.start(true);
      }
      return;
    }
    // Give replace/prepare time to discard the previous native status.
    if (now - this.startedAt < 1000) return;
    try {
      const status = this.player.currentStatus;
      if (!this.wanted) {
        // Resume from the notification/lock screen, without replacing the source.
        if (status.playing) {
          this.wanted = true;
          this.progressAt = now;
        } else return;
      }
      if (status.playbackState === "failed" || status.playbackState === "ended" ||
          (status.playbackState === "idle" && now - this.startedAt >= 2000)) {
        this.fail();
        return;
      }
      if (status.playing) {
        if (!this.wasPlaying || status.currentTime !== this.position) {
          this.progressAt = now;
          this.position = status.currentTime;
        }
        this.wasPlaying = true;
        this.setPlaying(true);
        if (this.state.isConnecting || this.state.playbackError) {
          this.update({ isConnecting: false, playbackError: null });
        }
      } else if (status.isLoaded && !status.isBuffering) {
        // Native pause/audio focus interruption is not a broken stream.
        this.wanted = false;
        this.setPlaying(false);
        this.update({ isConnecting: false });
        return;
      } else {
        this.setPlaying(false);
        if (!this.state.isConnecting) this.update({ isConnecting: true });
      }
      if (now - this.progressAt >= 20000) this.fail();
    } catch {
      if (this.wanted) this.fail();
    }
  }

  dispose() {
    this.disposed = true;
    this.retryAt = null;
    // useAudioPlayer owns native release; cleanup must not call a released object.
  }
}

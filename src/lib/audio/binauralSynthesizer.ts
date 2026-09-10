/**
 * 40Hz Gamma-Entrainment Audio Synthesizer
 *
 * Synthesizes 40Hz binaural beats on a warm 200Hz carrier wave (200Hz Left, 240Hz Right)
 * to facilitate cortical gamma synchronization (30-50Hz band, centered at 40Hz).
 * Blended with pink noise and gentle low-pass clinical hum for acoustic masking and sensory grounding.
 *
 * Safety & Quality:
 * - Strict mute-by-default policy.
 * - Smooth logarithmic volume fade-in (3.0s) and fade-out (1.5s) via linearRamp / exponentialRamp
 *   preventing audible clicks and acoustic startle response.
 * - Full SSR and headless environment safety (safe when AudioContext is unavailable).
 */

export type AudioEngineState =
  | "unsupported"
  | "idle"
  | "fading_in"
  | "playing"
  | "fading_out";

export interface BinauralConfig {
  /** Carrier wave frequency in Hz (Warm fundamental tone, default: 200Hz) */
  carrierFrequency: number;
  /** Entrainment difference frequency in Hz (Gamma target, default: 40Hz) */
  gammaFrequency: number;
  /** Volume fade-in time in seconds (default: 3.0s) */
  fadeInDuration: number;
  /** Volume fade-out time in seconds (default: 1.5s) */
  fadeOutDuration: number;
  /** Target master output volume [0.0 - 1.0] (default: 0.25) */
  masterVolume: number;
  /** Relative amplitude of soothing pink noise [0.0 - 1.0] (default: 0.08) */
  pinkNoiseVolume: number;
  /** Cutoff frequency for clinical hum low-pass filter in Hz (default: 450Hz) */
  lowpassCutoff: number;
}

export interface BinauralFrequencies {
  carrierFrequency: number;
  gammaFrequency: number;
  leftFrequency: number;
  rightFrequency: number;
  beatFrequency: number;
}

export const DEFAULT_CONFIG: Readonly<BinauralConfig> = Object.freeze({
  carrierFrequency: 200,
  gammaFrequency: 40,
  fadeInDuration: 3.0,
  fadeOutDuration: 1.5,
  masterVolume: 0.25,
  pinkNoiseVolume: 0.08,
  lowpassCutoff: 450,
});

/**
 * Floor threshold for exponential audio ramps.
 * Web Audio API throws if exponentialRampToValueAtTime targets 0.
 * 0.0001 represents -80dB, effectively inaudible silence.
 */
export const MIN_GAIN_VALUE = 0.0001;

/**
 * Validates and calculates dichotic frequencies for 40Hz binaural entrainment.
 * @param carrierFreq Base carrier frequency in Hz (default 200Hz)
 * @param gammaFreq Gamma difference frequency in Hz (default 40Hz)
 */
export function calculateBinauralFrequencies(
  carrierFreq = DEFAULT_CONFIG.carrierFrequency,
  gammaFreq = DEFAULT_CONFIG.gammaFrequency
): BinauralFrequencies {
  const safeCarrier = typeof carrierFreq === "number" && !isNaN(carrierFreq) && carrierFreq > 0
    ? carrierFreq
    : DEFAULT_CONFIG.carrierFrequency;

  const safeGamma = typeof gammaFreq === "number" && !isNaN(gammaFreq) && gammaFreq > 0
    ? gammaFreq
    : DEFAULT_CONFIG.gammaFrequency;

  const leftFrequency = safeCarrier;
  const rightFrequency = safeCarrier + safeGamma;
  const beatFrequency = Math.abs(rightFrequency - leftFrequency);

  return {
    carrierFrequency: safeCarrier,
    gammaFrequency: safeGamma,
    leftFrequency,
    rightFrequency,
    beatFrequency,
  };
}

/**
 * Clamps audio volume strictly within [min, max] range.
 * Non-numeric or NaN values are safely clamped to 0.0.
 */
export function clampVolume(volume: number, min = 0.0, max = 1.0): number {
  if (typeof volume !== "number" || isNaN(volume)) {
    return 0.0;
  }
  return Math.min(Math.max(volume, min), max);
}

/**
 * Checks whether the Web Audio API is available in the current environment.
 * Gracefully returns false in SSR, Node, or unsupported browsers.
 */
export function isAudioContextSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/**
 * Generates an in-memory loopable AudioBuffer containing filtered pink noise (1/f)
 * using Paul Kellet's refined 3-pole filter with boundary crossfade for seamless looping.
 */
export function generatePinkNoiseBuffer(
  ctx: AudioContext,
  durationSeconds = 4.0
): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < totalSamples; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.76160 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }

  // Crossfade head and tail over 50ms to eliminate looping click transients
  const crossfadeLength = Math.min(
    Math.floor(sampleRate * 0.05),
    Math.floor(totalSamples / 10)
  );

  for (let i = 0; i < crossfadeLength; i++) {
    const progress = i / crossfadeLength;
    const headIdx = i;
    const tailIdx = totalSamples - crossfadeLength + i;
    const blended = data[headIdx] * progress + data[tailIdx] * (1 - progress);
    data[headIdx] = blended;
    data[tailIdx] = blended;
  }

  return buffer;
}

/**
 * Core Web Audio Binaural Beat Synthesis Engine
 */
export class BinauralEngine {
  private config: BinauralConfig;
  private state: AudioEngineState = "idle";
  private ctx: AudioContext | null = null;

  // Nodes
  private masterGain: GainNode | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private pinkNoiseSource: AudioBufferSourceNode | null = null;
  private pinkNoiseGain: GainNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Timers & Observers
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly stateListeners: Set<(state: AudioEngineState) => void> = new Set();

  constructor(initialConfig: Partial<BinauralConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...initialConfig,
      masterVolume: clampVolume(initialConfig.masterVolume ?? DEFAULT_CONFIG.masterVolume),
    };

    if (!isAudioContextSupported()) {
      this.state = "unsupported";
    }
  }

  /**
   * Subscribes a listener to engine state changes.
   * Returns an unsubscribe callback.
   */
  public onStateChange(listener: (state: AudioEngineState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(nextState: AudioEngineState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    this.stateListeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch {
        // Suppress listener errors to preserve audio continuity
      }
    });
  }

  public getState(): AudioEngineState {
    return this.state;
  }

  public isPlaying(): boolean {
    return this.state === "playing" || this.state === "fading_in";
  }

  public getMasterVolume(): number {
    return this.config.masterVolume;
  }

  public getConfig(): Readonly<BinauralConfig> {
    return this.config;
  }

  /**
   * Updates configuration parameters.
   * If volume changes during active playback, smooth gain transition is applied.
   */
  public updateConfig(newConfig: Partial<BinauralConfig>): void {
    const prevVol = this.config.masterVolume;
    this.config = {
      ...this.config,
      ...newConfig,
      masterVolume: clampVolume(newConfig.masterVolume ?? this.config.masterVolume),
    };

    if (newConfig.masterVolume !== undefined && newConfig.masterVolume !== prevVol) {
      this.setMasterVolume(this.config.masterVolume);
    }
  }

  /**
   * Initializes the Web Audio context and node graph.
   * Strict mute-by-default policy: masterGain starts explicitly at 0.0.
   */
  private initAudioGraph(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      this.setState("unsupported");
      return false;
    }

    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContextClass();
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master Gain (Strict Mute by Default: 0.0)
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0, now);

    // Spectrum Analyser
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 64; // 32 frequency bins
    this.analyser.smoothingTimeConstant = 0.85;

    // Connect Master -> Analyser -> Output
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Calculate Entrainment Frequencies (200Hz Left, 240Hz Right for 40Hz beat)
    const freqs = calculateBinauralFrequencies(
      this.config.carrierFrequency,
      this.config.gammaFrequency
    );

    // Left Ear Oscillator (200Hz)
    this.leftOsc = ctx.createOscillator();
    this.leftOsc.type = "sine";
    this.leftOsc.frequency.setValueAtTime(freqs.leftFrequency, now);

    this.leftGain = ctx.createGain();
    this.leftGain.gain.setValueAtTime(0.5, now);
    this.leftOsc.connect(this.leftGain);

    // Right Ear Oscillator (240Hz)
    this.rightOsc = ctx.createOscillator();
    this.rightOsc.type = "sine";
    this.rightOsc.frequency.setValueAtTime(freqs.rightFrequency, now);

    this.rightGain = ctx.createGain();
    this.rightGain.gain.setValueAtTime(0.5, now);
    this.rightOsc.connect(this.rightGain);

    // Dichotic Separation: 2-Channel Merger
    // Channel 0 = Left Ear, Channel 1 = Right Ear
    this.merger = ctx.createChannelMerger(2);
    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
    this.merger.connect(this.masterGain);

    // Ambient Pink Noise / Clinical Hum Generator
    try {
      const noiseBuffer = generatePinkNoiseBuffer(ctx, 4.0);
      this.pinkNoiseSource = ctx.createBufferSource();
      this.pinkNoiseSource.buffer = noiseBuffer;
      this.pinkNoiseSource.loop = true;

      // Low-pass filter (450Hz) for soothing, velvet medical chamber ambience
      this.lowpassFilter = ctx.createBiquadFilter();
      this.lowpassFilter.type = "lowpass";
      this.lowpassFilter.frequency.setValueAtTime(this.config.lowpassCutoff, now);
      this.lowpassFilter.Q.setValueAtTime(0.707, now);

      this.pinkNoiseGain = ctx.createGain();
      this.pinkNoiseGain.gain.setValueAtTime(this.config.pinkNoiseVolume, now);

      this.pinkNoiseSource.connect(this.lowpassFilter);
      this.lowpassFilter.connect(this.pinkNoiseGain);
      this.pinkNoiseGain.connect(this.masterGain);
    } catch {
      // In constrained or mocked environments, proceed with pure sine tones
    }

    return true;
  }

  /**
   * Starts the 40Hz gamma entrainment atmosphere with a smooth 3.0s logarithmic fade-in.
   * Resumes AudioContext on user interaction to handle browser autoplay policies.
   */
  public async start(): Promise<void> {
    if (!isAudioContextSupported()) {
      this.setState("unsupported");
      return;
    }

    // If currently fading out, cancel pending shutdown and fade back up
    if (this.state === "fading_out" && this.masterGain && this.ctx) {
      if (this.fadeTimer) {
        clearTimeout(this.fadeTimer);
        this.fadeTimer = null;
      }
      const now = this.ctx.currentTime;
      const currentGain = Math.max(this.masterGain.gain.value, MIN_GAIN_VALUE);
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(currentGain, now);
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(this.config.masterVolume, MIN_GAIN_VALUE),
        now + this.config.fadeInDuration
      );

      this.setState("fading_in");
      this.fadeTimer = setTimeout(() => {
        this.setState("playing");
      }, this.config.fadeInDuration * 1000);
      return;
    }

    if (this.state === "playing" || this.state === "fading_in") {
      return;
    }

    const initialized = this.initAudioGraph();
    if (!initialized || !this.ctx || !this.masterGain) {
      return;
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Start all audio sources
    try {
      this.leftOsc?.start(now);
      this.rightOsc?.start(now);
      this.pinkNoiseSource?.start(now);
    } catch {
      // Handle cases where start was previously invoked
    }

    // Smooth Logarithmic Fade-In (3.0s):
    // 1. linear ramp to inaudible safe floor in 20ms
    // 2. exponential ramp from safe floor to target master volume
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.0, now);
    this.masterGain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, now + 0.02);
    this.masterGain.gain.exponentialRampToValueAtTime(
      Math.max(this.config.masterVolume, MIN_GAIN_VALUE),
      now + this.config.fadeInDuration
    );

    this.setState("fading_in");

    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
    }
    this.fadeTimer = setTimeout(() => {
      this.setState("playing");
    }, this.config.fadeInDuration * 1000);
  }

  /**
   * Stops the atmosphere with a smooth 1.5s fade-out preventing acoustic clicks.
   */
  public async stop(): Promise<void> {
    if (!this.ctx || !this.masterGain || this.state === "idle" || this.state === "unsupported") {
      return;
    }

    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    const now = this.ctx.currentTime;
    const currentGain = Math.max(this.masterGain.gain.value, MIN_GAIN_VALUE);

    // Smooth Logarithmic Fade-Out (1.5s):
    // 1. exponential ramp down to safe inaudible floor
    // 2. linear ramp to absolute 0
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(currentGain, now);
    this.masterGain.gain.exponentialRampToValueAtTime(
      MIN_GAIN_VALUE,
      now + this.config.fadeOutDuration
    );
    this.masterGain.gain.linearRampToValueAtTime(
      0.0,
      now + this.config.fadeOutDuration + 0.01
    );

    this.setState("fading_out");

    this.fadeTimer = setTimeout(() => {
      this.tearDownAudioNodes();
      this.setState("idle");
    }, this.config.fadeOutDuration * 1000 + 50);
  }

  /**
   * Toggles atmosphere playback between active and stopped states.
   */
  public async toggle(): Promise<boolean> {
    if (this.isPlaying()) {
      await this.stop();
      return false;
    } else {
      if (!isAudioContextSupported()) {
        this.setState("unsupported");
        return false;
      }
      await this.start();
      return this.isPlaying();
    }
  }

  /**
   * Sets the master volume [0.0 - 1.0].
   * If audio is active, smoothly ramps to the target volume over 50ms.
   */
  public setMasterVolume(volume: number): void {
    const clamped = clampVolume(volume);
    this.config.masterVolume = clamped;

    if (this.masterGain && this.ctx && (this.state === "playing" || this.state === "fading_in")) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, MIN_GAIN_VALUE), now);
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(clamped, MIN_GAIN_VALUE),
        now + 0.05
      );
    }
  }

  /**
   * Retrieves real-time FFT frequency data for visualizer rendering.
   * Returns a 32-element Uint8Array (values 0-255).
   * Safe when audio is inactive or unsupported (returns all zeroes).
   */
  public getAnalyserData(): Uint8Array {
    if (!this.analyser || this.state === "idle" || this.state === "unsupported") {
      return new Uint8Array(32);
    }
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    return buffer;
  }

  private tearDownAudioNodes(): void {
    try {
      this.leftOsc?.stop();
      this.rightOsc?.stop();
      this.pinkNoiseSource?.stop();
    } catch {
      // Nodes already stopped
    }

    try {
      this.leftOsc?.disconnect();
      this.rightOsc?.disconnect();
      this.leftGain?.disconnect();
      this.rightGain?.disconnect();
      this.merger?.disconnect();
      this.pinkNoiseSource?.disconnect();
      this.lowpassFilter?.disconnect();
      this.pinkNoiseGain?.disconnect();
      this.masterGain?.disconnect();
      this.analyser?.disconnect();
    } catch {
      // Disconnect safe
    }

    this.leftOsc = null;
    this.rightOsc = null;
    this.leftGain = null;
    this.rightGain = null;
    this.merger = null;
    this.pinkNoiseSource = null;
    this.lowpassFilter = null;
    this.pinkNoiseGain = null;
    this.masterGain = null;
    this.analyser = null;
  }

  /**
   * Complete engine disposal, stopping audio and closing context.
   */
  public dispose(): void {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
    this.tearDownAudioNodes();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.stateListeners.clear();
    this.setState("idle");
  }
}

// ============================================================================
// Functional API (Singleton delegates)
// ============================================================================

let globalEngine: BinauralEngine | null = null;

export function getBinauralEngine(config?: Partial<BinauralConfig>): BinauralEngine {
  if (!globalEngine) {
    globalEngine = new BinauralEngine(config);
  } else if (config) {
    globalEngine.updateConfig(config);
  }
  return globalEngine;
}

export async function startGammaAtmosphere(config?: Partial<BinauralConfig>): Promise<void> {
  const engine = getBinauralEngine(config);
  await engine.start();
}

export async function stopGammaAtmosphere(): Promise<void> {
  if (!globalEngine) return;
  await globalEngine.stop();
}

export function setMasterVolume(volume: number): void {
  const engine = getBinauralEngine();
  engine.setMasterVolume(volume);
}

export function getAnalyserData(): Uint8Array {
  if (!globalEngine) {
    return new Uint8Array(32);
  }
  return globalEngine.getAnalyserData();
}

export function getAtmosphereState(): AudioEngineState {
  if (!globalEngine) {
    return isAudioContextSupported() ? "idle" : "unsupported";
  }
  return globalEngine.getState();
}

/**
 * 40Hz Gamma-Entrainment Audio Synthesis Test Suite
 *
 * Validates:
 * - Parameter mathematics & dichotic frequency offsets (200Hz / 240Hz -> 40Hz gamma entrainment)
 * - Volume clamping & boundary protection
 * - SSR safety and graceful degradation when Web Audio API is unavailable
 * - Web Audio API mock lifecycle: mute-by-default, 3.0s fade-in, 1.5s fade-out, logarithmic ramps
 * - Pink noise buffer generation and crossfading
 */

import {
  calculateBinauralFrequencies,
  clampVolume,
  isAudioContextSupported,
  generatePinkNoiseBuffer,
  BinauralEngine,
  DEFAULT_CONFIG,
  MIN_GAIN_VALUE,
  startGammaAtmosphere,
  stopGammaAtmosphere,
  setMasterVolume,
  getAnalyserData,
  getAtmosphereState,
  getBinauralEngine,
  type AudioEngineState,
} from "../binauralSynthesizer";

describe("40Hz Gamma-Entrainment Synthesizer Suite", () => {
  // ==========================================================================
  // 1. PARAMETER MATHEMATICS & FREQUENCY OFFSETS
  // ==========================================================================
  describe("Parameter Mathematics & Dichotic Frequency Offsets", () => {
    test("Default parameters synthesize 40Hz cortical gamma envelope on 200Hz carrier wave", () => {
      const freqs = calculateBinauralFrequencies();

      expect(freqs.carrierFrequency).toBe(200);
      expect(freqs.gammaFrequency).toBe(40);
      expect(freqs.leftFrequency).toBe(200);
      expect(freqs.rightFrequency).toBe(240);
      expect(freqs.beatFrequency).toBe(40);
    });

    test("Dichotic channel difference matches cortical gamma frequency exactly", () => {
      const freqs = calculateBinauralFrequencies(200, 40);
      const difference = freqs.rightFrequency - freqs.leftFrequency;
      expect(difference).toBe(40);
      expect(freqs.beatFrequency).toBe(40);
    });

    test("Supports alternative carrier frequencies with constant 40Hz gamma offset", () => {
      const testCases = [
        { carrier: 180, gamma: 40, expectedLeft: 180, expectedRight: 220 },
        { carrier: 216, gamma: 40, expectedLeft: 216, expectedRight: 256 },
        { carrier: 250, gamma: 40, expectedLeft: 250, expectedRight: 290 },
      ];

      for (const tc of testCases) {
        const result = calculateBinauralFrequencies(tc.carrier, tc.gamma);
        expect(result.leftFrequency).toBe(tc.expectedLeft);
        expect(result.rightFrequency).toBe(tc.expectedRight);
        expect(result.beatFrequency).toBe(40);
      }
    });

    test("Supports custom gamma frequency entrainment within 30-50Hz band", () => {
      const gamma35 = calculateBinauralFrequencies(200, 35);
      expect(gamma35.leftFrequency).toBe(200);
      expect(gamma35.rightFrequency).toBe(235);
      expect(gamma35.beatFrequency).toBe(35);

      const gamma45 = calculateBinauralFrequencies(200, 45);
      expect(gamma45.leftFrequency).toBe(200);
      expect(gamma45.rightFrequency).toBe(245);
      expect(gamma45.beatFrequency).toBe(45);
    });

    test("Defensively falls back to clinical defaults on non-numeric or invalid parameters", () => {
      const nanTest = calculateBinauralFrequencies(NaN, NaN);
      expect(nanTest.carrierFrequency).toBe(200);
      expect(nanTest.gammaFrequency).toBe(40);
      expect(nanTest.leftFrequency).toBe(200);
      expect(nanTest.rightFrequency).toBe(240);
      expect(nanTest.beatFrequency).toBe(40);

      const negativeTest = calculateBinauralFrequencies(-100, -20);
      expect(negativeTest.carrierFrequency).toBe(200);
      expect(negativeTest.gammaFrequency).toBe(40);
      expect(negativeTest.beatFrequency).toBe(40);

      const zeroTest = calculateBinauralFrequencies(0, 0);
      expect(zeroTest.carrierFrequency).toBe(200);
      expect(zeroTest.gammaFrequency).toBe(40);
    });
  });

  // ==========================================================================
  // 2. VOLUME CLAMPING & ACOUSTIC SAFETY BOUNDARIES
  // ==========================================================================
  describe("Volume Clamping & Acoustic Safety", () => {
    test("Clamps volume strictly within [0.0, 1.0]", () => {
      expect(clampVolume(0.5)).toBe(0.5);
      expect(clampVolume(0.0)).toBe(0.0);
      expect(clampVolume(1.0)).toBe(1.0);
      expect(clampVolume(0.25)).toBe(0.25);
    });

    test("Clamps negative volumes to safe silence (0.0)", () => {
      expect(clampVolume(-0.01)).toBe(0.0);
      expect(clampVolume(-1.0)).toBe(0.0);
      expect(clampVolume(-999)).toBe(0.0);
    });

    test("Clamps excessive volumes above 1.0 to maximum unity gain (1.0)", () => {
      expect(clampVolume(1.01)).toBe(1.0);
      expect(clampVolume(2.5)).toBe(1.0);
      expect(clampVolume(100)).toBe(1.0);
    });

    test("Gracefully handles non-numeric and NaN values by returning 0.0 (safe mute)", () => {
      expect(clampVolume(NaN)).toBe(0.0);
      expect(clampVolume(undefined as unknown as number)).toBe(0.0);
      expect(clampVolume(null as unknown as number)).toBe(0.0);
      expect(clampVolume("0.5" as unknown as number)).toBe(0.0);
    });

    test("Respects custom min and max clamping boundaries", () => {
      expect(clampVolume(0.1, 0.2, 0.8)).toBe(0.2);
      expect(clampVolume(0.9, 0.2, 0.8)).toBe(0.8);
      expect(clampVolume(0.5, 0.2, 0.8)).toBe(0.5);
    });
  });

  // ==========================================================================
  // 3. ARCHITECTURAL CONSTANTS & DEFAULT CONFIGURATION
  // ==========================================================================
  describe("Architectural Constants & Clinical Parameters", () => {
    test("Default configuration satisfies clinical acoustic specifications", () => {
      expect(DEFAULT_CONFIG.carrierFrequency).toBe(200);
      expect(DEFAULT_CONFIG.gammaFrequency).toBe(40);
      expect(DEFAULT_CONFIG.fadeInDuration).toBe(3.0);
      expect(DEFAULT_CONFIG.fadeOutDuration).toBe(1.5);
      expect(DEFAULT_CONFIG.masterVolume).toBe(0.25);
      expect(DEFAULT_CONFIG.pinkNoiseVolume).toBe(0.08);
      expect(DEFAULT_CONFIG.lowpassCutoff).toBe(450);
    });

    test("MIN_GAIN_VALUE is strictly positive and prevents Web Audio exponential ramp error", () => {
      expect(MIN_GAIN_VALUE).toBeGreaterThan(0);
      expect(MIN_GAIN_VALUE).toBe(0.0001); // -80dB
    });
  });

  // ==========================================================================
  // 4. SSR SAFETY & HEADLESS NODE ENVIRONMENT GRACEFUL DEGRADATION
  // ==========================================================================
  describe("SSR & Headless Node Environment Safety", () => {
    test("isAudioContextSupported returns false when window is undefined in Node", () => {
      expect(typeof window).toBe("undefined");
      expect(isAudioContextSupported()).toBe(false);
    });

    test("BinauralEngine instantiates cleanly without throwing in Node", () => {
      const engine = new BinauralEngine();
      expect(engine.getState()).toBe("unsupported");
      expect(engine.isPlaying()).toBe(false);
      expect(engine.getMasterVolume()).toBe(0.25);
    });

    test("Engine methods resolve gracefully in SSR without throwing errors", async () => {
      const engine = new BinauralEngine();

      await expect(engine.start()).resolves.toBeUndefined();
      expect(engine.getState()).toBe("unsupported");

      await expect(engine.stop()).resolves.toBeUndefined();
      await expect(engine.toggle()).resolves.toBe(false);

      expect(() => engine.setMasterVolume(0.5)).not.toThrow();
      expect(engine.getMasterVolume()).toBe(0.5);

      const analyserData = engine.getAnalyserData();
      expect(analyserData).toBeInstanceOf(Uint8Array);
      expect(analyserData.length).toBe(32);
      expect(analyserData.every((val) => val === 0)).toBe(true);

      expect(() => engine.dispose()).not.toThrow();
    });

    test("Functional singleton delegates execute safely in SSR", async () => {
      const singletonEngine = getBinauralEngine({ masterVolume: 0.2 });
      expect(singletonEngine).toBeInstanceOf(BinauralEngine);
      expect(singletonEngine.getMasterVolume()).toBe(0.2);

      await expect(startGammaAtmosphere()).resolves.toBeUndefined();
      await expect(stopGammaAtmosphere()).resolves.toBeUndefined();
      expect(() => setMasterVolume(0.3)).not.toThrow();

      const data = getAnalyserData();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(32);

      const state = getAtmosphereState();
      expect(state).toBe("unsupported");
    });
  });

  // ==========================================================================
  // 5. MOCKED WEB AUDIO API LIFECYCLE, RAMPS, & PINK NOISE GENERATION
  // ==========================================================================
  describe("Mocked Web Audio API Lifecycle & Acoustic Synthesis", () => {
    let mockCtx: MockAudioContext;

    interface ScheduledCall {
      method: string;
      value?: number;
      time?: number;
    }

    class MockAudioParam {
      public value = 0;
      public scheduledCalls: ScheduledCall[] = [];

      setValueAtTime(val: number, time: number): void {
        this.value = val;
        this.scheduledCalls.push({ method: "setValueAtTime", value: val, time });
      }

      linearRampToValueAtTime(val: number, time: number): void {
        this.value = val;
        this.scheduledCalls.push({ method: "linearRampToValueAtTime", value: val, time });
      }

      exponentialRampToValueAtTime(val: number, time: number): void {
        this.value = val;
        this.scheduledCalls.push({ method: "exponentialRampToValueAtTime", value: val, time });
      }

      cancelScheduledValues(time: number): void {
        this.scheduledCalls.push({ method: "cancelScheduledValues", time });
      }
    }

    class MockAudioNode {
      public connectedTo: unknown[] = [];
      connect(destination: unknown): unknown {
        this.connectedTo.push(destination);
        return destination;
      }
      disconnect(): void {
        this.connectedTo = [];
      }
    }

    class MockGainNode extends MockAudioNode {
      public gain = new MockAudioParam();
    }

    class MockOscillatorNode extends MockAudioNode {
      public type = "sine";
      public frequency = new MockAudioParam();
      public started = false;
      public stopped = false;

      start(): void {
        this.started = true;
      }
      stop(): void {
        this.stopped = true;
      }
    }

    class MockChannelMergerNode extends MockAudioNode {
      public channelCount: number;
      constructor(channels: number) {
        super();
        this.channelCount = channels;
      }
    }

    class MockBiquadFilterNode extends MockAudioNode {
      public type = "lowpass";
      public frequency = new MockAudioParam();
      public Q = new MockAudioParam();
    }

    class MockAudioBufferSourceNode extends MockAudioNode {
      public buffer: unknown = null;
      public loop = false;
      public started = false;
      public stopped = false;

      start(): void {
        this.started = true;
      }
      stop(): void {
        this.stopped = true;
      }
    }

    class MockAnalyserNode extends MockAudioNode {
      public fftSize = 64;
      public frequencyBinCount = 32;
      public smoothingTimeConstant = 0.85;

      getByteFrequencyData(array: Uint8Array): void {
        array.fill(128); // Simulate non-zero frequency spectrum
      }
    }

    class MockAudioBuffer {
      public sampleRate: number;
      public length: number;
      public duration: number;
      private channels: Float32Array[];

      constructor(numberOfChannels: number, length: number, sampleRate: number) {
        this.sampleRate = sampleRate;
        this.length = length;
        this.duration = length / sampleRate;
        this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
      }

      getChannelData(channel: number): Float32Array {
        return this.channels[channel];
      }
    }

    class MockAudioContext {
      public currentTime = 10.0;
      public sampleRate = 44100;
      public state: "suspended" | "running" | "closed" = "suspended";
      public destination = new MockAudioNode();

      public createdOscillators: MockOscillatorNode[] = [];
      public createdGainNodes: MockGainNode[] = [];
      public createdMergers: MockChannelMergerNode[] = [];
      public createdFilters: MockBiquadFilterNode[] = [];
      public createdBufferSources: MockAudioBufferSourceNode[] = [];
      public createdAnalysers: MockAnalyserNode[] = [];

      async resume(): Promise<void> {
        this.state = "running";
      }

      async close(): Promise<void> {
        this.state = "closed";
      }

      createGain(): MockGainNode {
        const node = new MockGainNode();
        this.createdGainNodes.push(node);
        return node;
      }

      createOscillator(): MockOscillatorNode {
        const node = new MockOscillatorNode();
        this.createdOscillators.push(node);
        return node;
      }

      createChannelMerger(channels: number): MockChannelMergerNode {
        const node = new MockChannelMergerNode(channels);
        this.createdMergers.push(node);
        return node;
      }

      createBiquadFilter(): MockBiquadFilterNode {
        const node = new MockBiquadFilterNode();
        this.createdFilters.push(node);
        return node;
      }

      createBuffer(channels: number, length: number, sampleRate: number): MockAudioBuffer {
        return new MockAudioBuffer(channels, length, sampleRate);
      }

      createBufferSource(): MockAudioBufferSourceNode {
        const node = new MockAudioBufferSourceNode();
        this.createdBufferSources.push(node);
        return node;
      }

      createAnalyser(): MockAnalyserNode {
        const node = new MockAnalyserNode();
        this.createdAnalysers.push(node);
        return node;
      }
    }

    beforeEach(() => {
      jest.useFakeTimers();
      mockCtx = new MockAudioContext();

      // Install browser globals
      (global as unknown as { window: unknown }).window = {
        AudioContext: jest.fn(() => mockCtx) as unknown as typeof AudioContext,
      };
    });

    afterEach(() => {
      jest.useRealTimers();
      delete (global as unknown as { window?: unknown }).window;
    });

    test("isAudioContextSupported returns true when AudioContext is present on window", () => {
      expect(isAudioContextSupported()).toBe(true);
    });

    test("generatePinkNoiseBuffer creates seamless looped buffer with head/tail crossfade", () => {
      const buffer = generatePinkNoiseBuffer(mockCtx as unknown as AudioContext, 2.0);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(44100 * 2);

      const channelData = buffer.getChannelData(0);
      expect(channelData.length).toBe(buffer.length);

      // Verify non-zero pink noise values
      let nonZeroCount = 0;
      for (let i = 0; i < 100; i++) {
        if (channelData[i] !== 0) nonZeroCount++;
      }
      expect(nonZeroCount).toBeGreaterThan(50);
    });

    test("Engine initialization enforces strict mute-by-default policy", async () => {
      const engine = new BinauralEngine();
      expect(engine.getState()).toBe("idle");

      // Before start, audio graph is not active
      expect(engine.isPlaying()).toBe(false);
    });

    test("start() configures 200Hz left and 240Hz right oscillators with ChannelMerger", async () => {
      const engine = new BinauralEngine();
      await engine.start();

      // AudioContext resumed from suspended state
      expect(mockCtx.state).toBe("running");

      // Verify Oscillators: 200Hz Left, 240Hz Right
      expect(mockCtx.createdOscillators.length).toBe(2);
      const leftOsc = mockCtx.createdOscillators[0];
      const rightOsc = mockCtx.createdOscillators[1];

      expect(leftOsc.frequency.scheduledCalls[0].value).toBe(200);
      expect(rightOsc.frequency.scheduledCalls[0].value).toBe(240);
      expect(leftOsc.started).toBe(true);
      expect(rightOsc.started).toBe(true);

      // Verify 2-Channel Merger
      expect(mockCtx.createdMergers.length).toBe(1);
      expect(mockCtx.createdMergers[0].channelCount).toBe(2);
    });

    test("start() performs smooth 3.0s logarithmic volume fade-in with click prevention", async () => {
      const engine = new BinauralEngine({ masterVolume: 0.3 });
      await engine.start();

      expect(engine.getState()).toBe("fading_in");

      // Master Gain is createdGainNodes[0]
      const masterGain = mockCtx.createdGainNodes[0];
      const calls = masterGain.gain.scheduledCalls;

      // Strict mute-by-default initial value: 0.0
      expect(calls[0]).toEqual({ method: "setValueAtTime", value: 0.0, time: 10.0 });
      // Linear ramp to safe floor
      expect(calls[1]).toEqual({ method: "cancelScheduledValues", time: 10.0 });
      expect(calls[2]).toEqual({ method: "setValueAtTime", value: 0.0, time: 10.0 });
      expect(calls[3]).toEqual({ method: "linearRampToValueAtTime", value: MIN_GAIN_VALUE, time: 10.02 });
      // Exponential ramp to target master volume (0.3) over 3.0s (10.0 + 3.0 = 13.0)
      expect(calls[4]).toEqual({ method: "exponentialRampToValueAtTime", value: 0.3, time: 13.0 });

      // Fast-forward fade duration
      jest.advanceTimersByTime(3000);
      expect(engine.getState()).toBe("playing");
      expect(engine.isPlaying()).toBe(true);
    });

    test("stop() performs smooth 1.5s logarithmic fade-out preventing acoustic clicks", async () => {
      const engine = new BinauralEngine({ masterVolume: 0.3 });
      await engine.start();
      jest.advanceTimersByTime(3000);
      expect(engine.getState()).toBe("playing");

      const masterGain = mockCtx.createdGainNodes[0];
      masterGain.gain.value = 0.3; // Current gain during playback

      await engine.stop();
      expect(engine.getState()).toBe("fading_out");

      const calls = masterGain.gain.scheduledCalls;
      // Exponential ramp down to MIN_GAIN_VALUE over 1.5s
      const expRamp = calls.find(
        (c) => c.method === "exponentialRampToValueAtTime" && c.value === MIN_GAIN_VALUE
      );
      expect(expRamp).toBeDefined();
      expect(expRamp?.time).toBe(10.0 + 1.5);

      // Linear ramp to absolute 0
      const linearRampToZero = calls.find(
        (c) => c.method === "linearRampToValueAtTime" && c.value === 0.0
      );
      expect(linearRampToZero).toBeDefined();

      // Fast-forward fade-out timer
      jest.advanceTimersByTime(1600);
      expect(engine.getState()).toBe("idle");
      expect(engine.isPlaying()).toBe(false);
    });

    test("toggle() alternates between start and stop states seamlessly", async () => {
      const engine = new BinauralEngine();

      const started = await engine.toggle();
      expect(started).toBe(true);
      expect(engine.getState()).toBe("fading_in");

      const stopped = await engine.toggle();
      expect(stopped).toBe(false);
      expect(engine.getState()).toBe("fading_out");
    });

    test("setMasterVolume() during active playback smoothly ramps gain without clicks", async () => {
      const engine = new BinauralEngine({ masterVolume: 0.25 });
      await engine.start();
      jest.advanceTimersByTime(3000);
      expect(engine.getState()).toBe("playing");

      const masterGain = mockCtx.createdGainNodes[0];
      masterGain.gain.value = 0.25;

      engine.setMasterVolume(0.45);
      expect(engine.getMasterVolume()).toBe(0.45);

      const rampCalls = masterGain.gain.scheduledCalls.filter(
        (c) => c.method === "exponentialRampToValueAtTime"
      );
      const latestRamp = rampCalls[rampCalls.length - 1];
      expect(latestRamp.value).toBe(0.45);
    });

    test("getAnalyserData() returns real-time frequency spectrum when playing", async () => {
      const engine = new BinauralEngine();
      await engine.start();
      jest.advanceTimersByTime(3000);

      const data = engine.getAnalyserData();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(32);
      expect(data[0]).toBe(128); // Filled by mock analyser
    });

    test("onStateChange notifies listeners on state transitions", async () => {
      const engine = new BinauralEngine();
      const stateHistory: AudioEngineState[] = [];

      const unsubscribe = engine.onStateChange((state) => {
        stateHistory.push(state);
      });

      await engine.start();
      jest.advanceTimersByTime(3000);
      await engine.stop();
      jest.advanceTimersByTime(1600);

      expect(stateHistory).toContain("idle");
      expect(stateHistory).toContain("fading_in");
      expect(stateHistory).toContain("playing");
      expect(stateHistory).toContain("fading_out");

      unsubscribe();
    });

    test("dispose() disconnects all audio nodes, clears timers, and closes context", async () => {
      const engine = new BinauralEngine();
      await engine.start();

      engine.dispose();
      expect(mockCtx.state).toBe("closed");
      expect(engine.getState()).toBe("idle");
    });
  });
});

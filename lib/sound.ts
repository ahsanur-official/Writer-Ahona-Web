"use client";

// Ambient sound generator for immersive Bengali literature reading using Web Audio API
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private rainNode: AudioNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isPlaying = false;
  private currentMode: "rain" | "meditative" | "off" = "off";

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private createPinkNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // gentle volume
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public playRain() {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    if (!this.noiseBuffer) {
      this.noiseBuffer = this.createPinkNoise();
    }
    if (!this.noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    // Filter to simulate soft raindrops on leaves/window
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.35;

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start();
    this.rainNode = noiseSource;
    this.isPlaying = true;
    this.currentMode = "rain";
  }

  public playMeditative() {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = 174; // gentle healing frequency
    osc2.type = "triangle";
    osc2.frequency.value = 175.5; // slight binaural beating for deep focus

    gain.gain.value = 0.08;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();

    this.rainNode = gain;
    this.isPlaying = true;
    this.currentMode = "meditative";
  }

  public stop() {
    if (this.rainNode) {
      try {
        if ("stop" in this.rainNode && typeof (this.rainNode as AudioScheduledSourceNode).stop === "function") {
          (this.rainNode as AudioScheduledSourceNode).stop();
        }
        this.rainNode.disconnect();
      } catch {
        // ignore cleanup error
      }
      this.rainNode = null;
    }
    this.isPlaying = false;
    this.currentMode = "off";
  }

  public toggleMode(): "rain" | "meditative" | "off" {
    if (this.currentMode === "off") {
      this.playRain();
      return "rain";
    } else if (this.currentMode === "rain") {
      this.playMeditative();
      return "meditative";
    } else {
      this.stop();
      return "off";
    }
  }

  public getStatus() {
    return { isPlaying: this.isPlaying, mode: this.currentMode };
  }
}

export const ambientSound = typeof window !== "undefined" ? new AmbientAudioEngine() : null;
export const ambientAudio = ambientSound;

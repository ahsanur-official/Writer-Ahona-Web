"use client";

// High-fidelity Web Audio API Ambient Soundscapes for immersive reading
export type SoundTrackId = "rain" | "flute" | "river" | "forest" | "night" | "fire";

export interface SoundTrackInfo {
  id: SoundTrackId;
  name: string;
  nameEn: string;
  icon: string;
  tagline: string;
}

export const SOUND_TRACKS: SoundTrackInfo[] = [
  {
    id: "rain",
    name: "শ্রাবণের বৃষ্টি",
    nameEn: "Monsoon Rain",
    icon: "🌧️",
    tagline: "জানালায় ঝরে পড়া অবিশ্রান্ত বৃষ্টির স্নিগ্ধ শব্দ",
  },
  {
    id: "flute",
    name: "তানপুরা ও বাঁশির সুর",
    nameEn: "Tanpura & Drone",
    icon: "🪈",
    tagline: "ধ্যানমগ্ন ক্লাসিক্যাল তানপুরার সুরে গভীর একাগ্রতা",
  },
  {
    id: "river",
    name: "নদীর কলতান",
    nameEn: "Flowing River",
    icon: "🌊",
    tagline: "পল্লী নদীর বুকে মৃদু ঢেউ ও জলের শান্ত ছন্দ",
  },
  {
    id: "forest",
    name: "অরণ্যের মৃদুমন্দ বাতাস",
    nameEn: "Forest Breeze",
    icon: "🍃",
    tagline: "গাছের পাতায় মৃদু হাওয়া ও প্রকৃতির দোলা",
  },
  {
    id: "night",
    name: "রাতের নিস্তব্ধতা ও ঝিঁঝিঁ",
    nameEn: "Night Crickets",
    icon: "🌙",
    tagline: "গভীর রাতের শান্ত নীরবতা ও দূরের ঝিঁঝিঁর গান",
  },
  {
    id: "fire",
    name: "অগ্নিকুণ্ডের মৃদু উত্তাপ",
    nameEn: "Cozy Hearth",
    icon: "🔥",
    tagline: "কাঠের মৃদু চটপট শব্দ ও উষ্ণ পরিবেশ",
  },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private masterGain: GainNode | null = null;
  private currentTrack: SoundTrackId | null = null;
  private volume = 0.5; // 0.0 to 1.0
  private listeners: (() => void)[] = [];

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public isPlaying(): boolean {
    return this.currentTrack !== null;
  }

  public getCurrentTrack(): SoundTrackId | null {
    return this.currentTrack;
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node === "number") {
          window.clearInterval(node);
        } else if ("stop" in node && typeof (node as AudioScheduledSourceNode).stop === "function") {
          (node as AudioScheduledSourceNode).stop();
          node.disconnect();
        } else if ("disconnect" in node) {
          node.disconnect();
        }
      } catch {
        // ignore cleanup error
      }
    });
    this.activeNodes = [];
    this.currentTrack = null;
    this.notify();
  }

  public playTrack(trackId: SoundTrackId) {
    if (this.currentTrack === trackId) {
      // Toggle off if clicking current active track
      this.stop();
      return;
    }

    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentTrack = trackId;

    switch (trackId) {
      case "rain":
        this.startRain();
        break;
      case "flute":
        this.startFlute();
        break;
      case "river":
        this.startRiver();
        break;
      case "forest":
        this.startForest();
        break;
      case "night":
        this.startNight();
        break;
      case "fire":
        this.startFire();
        break;
    }

    this.notify();
  }

  // Helper: Pink noise generator buffer
  private createPinkNoiseBuffer(durationSec = 3): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * durationSec;
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
      data[i] *= 0.12;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // 1. Monsoon Rain
  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const buf = this.createPinkNoiseBuffer(4);
    if (!buf) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1150;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, filter, gain);
  }

  // 2. Classical Tanpura & Flute Drone (Indian classical reading raga: Sa-Pa harmonic resonance)
  private startFlute() {
    if (!this.ctx || !this.masterGain) return;

    // Fundamental Sa (C#3 / ~138.6Hz) & Pa (~207.65Hz)
    const baseFreq = 138.6;
    const notes = [baseFreq, baseFreq * 1.5, baseFreq * 2, baseFreq * 3.01];

    const groupGain = this.ctx.createGain();
    groupGain.gain.value = 0.22;
    groupGain.connect(this.masterGain);
    this.activeNodes.push(groupGain);

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;

      // Slow breathing amplitude modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.12 + idx * 0.04;
      lfoGain.gain.value = 0.08;

      lfo.connect(lfoGain);
      lfoGain.connect(noteGain.gain);

      noteGain.gain.value = 0.15 / (idx + 1);

      osc.connect(noteGain);
      noteGain.connect(groupGain);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, noteGain, lfo, lfoGain);
    });
  }

  // 3. Flowing River Waters
  private startRiver() {
    if (!this.ctx || !this.masterGain) return;
    const buf = this.createPinkNoiseBuffer(3);
    if (!buf) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    // Resonant bandpass filter with slow undulating ripple LFO
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 680;
    filter.Q.value = 1.4;

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.28; // undulating ripples
    lfoGain.gain.value = 240;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.value = 0.65;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    lfo.start();
    this.activeNodes.push(source, filter, lfo, lfoGain, gain);
  }

  // 4. Forest Breeze & Leaves
  private startForest() {
    if (!this.ctx || !this.masterGain) return;
    const buf = this.createPinkNoiseBuffer(4);
    if (!buf) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;

    // Sweeping wind gusts
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.08; // slow deep gusts
    lfoGain.gain.value = 280;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.value = 0.55;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    lfo.start();
    this.activeNodes.push(source, filter, lfo, lfoGain, gain);
  }

  // 5. Night Silence & Crickets
  private startNight() {
    if (!this.ctx || !this.masterGain) return;

    // Low tranquil night air
    const nightAir = this.createPinkNoiseBuffer(2);
    if (nightAir) {
      const source = this.ctx.createBufferSource();
      source.buffer = nightAir;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;

      const airGain = this.ctx.createGain();
      airGain.gain.value = 0.2;

      source.connect(filter);
      filter.connect(airGain);
      airGain.connect(this.masterGain);
      source.start();
      this.activeNodes.push(source, filter, airGain);
    }

    // Cricket chirps with high modulated frequency
    const osc = this.ctx.createOscillator();
    const chirpFilter = this.ctx.createBiquadFilter();
    chirpFilter.type = "bandpass";
    chirpFilter.frequency.value = 4600;
    chirpFilter.Q.value = 8;

    osc.type = "sine";
    osc.frequency.value = 4600;

    // Rapid chirp pulsed amplitude
    const chirpLFO = this.ctx.createOscillator();
    chirpLFO.type = "square";
    chirpLFO.frequency.value = 16; // 16 Hz cricket pulses

    const chirpLFOGain = this.ctx.createGain();
    chirpLFOGain.gain.value = 0.04;

    const mainChirpGain = this.ctx.createGain();
    mainChirpGain.gain.value = 0.04;

    // Slow on-and-off pause interval
    const intervalId = window.setInterval(() => {
      if (mainChirpGain && this.ctx) {
        const target = Math.random() > 0.4 ? 0.05 : 0.005;
        mainChirpGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
      }
    }, 1800);

    chirpLFO.connect(chirpLFOGain);
    chirpLFOGain.connect(mainChirpGain.gain);

    osc.connect(chirpFilter);
    chirpFilter.connect(mainChirpGain);
    mainChirpGain.connect(this.masterGain);

    osc.start();
    chirpLFO.start();
    this.activeNodes.push(osc, chirpFilter, chirpLFO, chirpLFOGain, mainChirpGain, intervalId);
  }

  // 6. Hearth Fireplace & Crackle
  private startFire() {
    if (!this.ctx || !this.masterGain) return;

    // Deep warm roar
    const buf = this.createPinkNoiseBuffer(3);
    if (buf) {
      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      const roarGain = this.ctx.createGain();
      roarGain.gain.value = 0.4;

      source.connect(filter);
      filter.connect(roarGain);
      roarGain.connect(this.masterGain);
      source.start();
      this.activeNodes.push(source, filter, roarGain);
    }

    // Occasional gentle crackles
    const intervalId = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.currentTrack !== "fire") return;
      if (Math.random() < 0.65) return;

      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      const clickFilter = this.ctx.createBiquadFilter();

      clickFilter.type = "bandpass";
      clickFilter.frequency.value = 1800 + Math.random() * 2200;
      clickFilter.Q.value = 4;

      clickOsc.type = "triangle";
      clickOsc.frequency.value = 1200 + Math.random() * 1500;

      clickGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.masterGain);

      clickOsc.start();
      clickOsc.stop(this.ctx.currentTime + 0.05);
    }, 280);

    this.activeNodes.push(intervalId);
  }

  // Legacy compatibility
  public playRain() {
    this.playTrack("rain");
  }

  public playMeditative() {
    this.playTrack("flute");
  }

  public toggleMode(): "rain" | "meditative" | "off" {
    if (this.currentTrack === "rain") {
      this.playTrack("flute");
      return "meditative";
    } else if (this.currentTrack === "flute") {
      this.stop();
      return "off";
    } else {
      this.playTrack("rain");
      return "rain";
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying(),
      mode: this.currentTrack || "off",
      track: this.currentTrack,
    };
  }
}

export const ambientSound = typeof window !== "undefined" ? new AmbientAudioEngine() : null;
export const ambientAudio = ambientSound;

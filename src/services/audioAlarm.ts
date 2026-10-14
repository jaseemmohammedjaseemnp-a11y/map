import type { AlarmSoundType } from '../types';

class AudioAlarmService {
  private audioCtx: AudioContext | null = null;
  private isUnlocked = false;
  private isAlarmPlaying = false;
  private loopIntervalId: number | null = null;
  private vibrationIntervalId: number | null = null;

  /**
   * Initialize or resume the Web Audio Context via an explicit user gesture
   */
  public async unlockAudio(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('Web Audio API is not supported in this browser.');
          return false;
        }
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Play silent short buffer to ensure unlock on iOS Safari
      const silentBuffer = this.audioCtx.createBuffer(1, 1, 22050);
      const source = this.audioCtx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this.audioCtx.destination);
      source.start(0);

      this.isUnlocked = this.audioCtx.state === 'running';
      return this.isUnlocked;
    } catch (err) {
      console.warn('AudioContext activation failed:', err);
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked && !!this.audioCtx && this.audioCtx.state === 'running';
  }

  /**
   * Play a single sequence of the chosen alarm sound
   */
  public playSoundPattern(soundType: AlarmSoundType = 'chime', volume = 0.9): void {
    if (!this.audioCtx) {
      this.unlockAudio();
    }
    if (!this.audioCtx) return;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.1, Math.min(1, volume)), now);
      masterGain.connect(this.audioCtx.destination);

      switch (soundType) {
        case 'chime':
          this.synthesizeChime(now, masterGain);
          break;
        case 'radar':
          this.synthesizeRadar(now, masterGain);
          break;
        case 'siren':
          this.synthesizeSiren(now, masterGain);
          break;
        case 'subtle':
          this.synthesizeSubtle(now, masterGain);
          break;
        default:
          this.synthesizeChime(now, masterGain);
      }
    } catch (e) {
      console.error('Error synthesizing audio pattern:', e);
    }
  }

  /**
   * Start the continuous repeating alarm loop and vibration
   */
  public startAlarmLoop(
    soundType: AlarmSoundType = 'chime',
    volume = 0.9,
    enableVibration = true
  ): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    // Immediately play first alert
    this.playSoundPattern(soundType, volume);
    if (enableVibration) {
      this.triggerVibration();
    }

    const intervalMs = soundType === 'siren' ? 1600 : 2000;

    this.loopIntervalId = window.setInterval(() => {
      if (!this.isAlarmPlaying) return;
      this.playSoundPattern(soundType, volume);
    }, intervalMs);

    if (enableVibration) {
      this.vibrationIntervalId = window.setInterval(() => {
        if (!this.isAlarmPlaying) return;
        this.triggerVibration();
      }, 2000);
    }
  }

  /**
   * Stop all repeating alarm audio and vibrations
   */
  public stopAlarm(): void {
    this.isAlarmPlaying = false;

    if (this.loopIntervalId !== null) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }

    if (this.vibrationIntervalId !== null) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  public isPlaying(): boolean {
    return this.isAlarmPlaying;
  }

  private triggerVibration(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 800]);
      } catch (err) {
        console.warn('Vibration API blocked or unavailable:', err);
      }
    }
  }

  private synthesizeChime(startTime: number, outputNode: AudioNode): void {
    if (!this.audioCtx) return;
    // Loud, bright dual-tone brass bell strike with wake-up harmonics
    const bellStrikes = [
      { t: 0.0, freq: 880, overtone: 1760, vol: 0.75 },
      { t: 0.18, freq: 1046.5, overtone: 2093, vol: 0.8 },
      { t: 0.40, freq: 880, overtone: 1760, vol: 0.85 },
      { t: 0.62, freq: 1174.6, overtone: 2349, vol: 0.9 },
    ];

    bellStrikes.forEach(({ t, freq, overtone, vol }) => {
      const strikeTime = startTime + t;

      // Fundamental tone
      const osc1 = this.audioCtx!.createOscillator();
      const gain1 = this.audioCtx!.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, strikeTime);

      gain1.gain.setValueAtTime(0.001, strikeTime);
      gain1.gain.linearRampToValueAtTime(vol, strikeTime + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.75);

      osc1.connect(gain1);
      gain1.connect(outputNode);
      osc1.start(strikeTime);
      osc1.stop(strikeTime + 0.8);

      // Bright bell harmonic overtone
      const osc2 = this.audioCtx!.createOscillator();
      const gain2 = this.audioCtx!.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(overtone, strikeTime);

      gain2.gain.setValueAtTime(0.001, strikeTime);
      gain2.gain.linearRampToValueAtTime(vol * 0.45, strikeTime + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.55);

      osc2.connect(gain2);
      gain2.connect(outputNode);
      osc2.start(strikeTime);
      osc2.stop(strikeTime + 0.6);
    });
  }

  private synthesizeRadar(startTime: number, outputNode: AudioNode): void {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, startTime);
    osc.frequency.exponentialRampToValueAtTime(450, startTime + 0.6);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

    osc.connect(gain);
    gain.connect(outputNode);

    osc.start(startTime);
    osc.stop(startTime + 0.95);
  }

  private synthesizeSiren(startTime: number, outputNode: AudioNode): void {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.setValueAtTime(620, startTime + 0.28);
    osc.frequency.setValueAtTime(880, startTime + 0.56);
    osc.frequency.setValueAtTime(620, startTime + 0.84);

    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.45, startTime + 0.05);
    gain.gain.setValueAtTime(0.45, startTime + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.25);

    osc.connect(gain);
    gain.connect(outputNode);

    osc.start(startTime);
    osc.stop(startTime + 1.3);
  }

  private synthesizeSubtle(startTime: number, outputNode: AudioNode): void {
    if (!this.audioCtx) return;

    [440, 554.37].forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.15);

      const noteStart = startTime + idx * 0.15;
      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.7);

      osc.connect(gain);
      gain.connect(outputNode);

      osc.start(noteStart);
      osc.stop(noteStart + 0.75);
    });
  }
}

export const audioAlarm = new AudioAlarmService();

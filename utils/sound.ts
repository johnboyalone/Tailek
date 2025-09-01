class SoundManager {
    private audioContext: AudioContext | null = null;
    private sfxEnabled = true;
    private bgmEnabled = true;
    private bgmNode: OscillatorNode | null = null;
    private bgmGain: GainNode | null = null;
    private bgmInterval: number | null = null;

    private initAudioContext() {
        if (this.audioContext === null) {
            try {
                // Use AudioContext directly; webkitAudioContext is deprecated
                this.audioContext = new AudioContext();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser", e);
            }
        }
    }

    private playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol: number = 0.5) {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(vol, this.audioContext.currentTime); // Start volume
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration); // Fade out

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    public play(soundName: 'click' | 'guess' | 'turn' | 'win' | 'lose') {
        this.initAudioContext();
        if (!this.sfxEnabled || !this.audioContext) return;

        switch (soundName) {
            case 'click':
                this.playTone(880, 0.05, 'triangle', 0.3);
                break;
            case 'guess':
                this.playTone(660, 0.1, 'sine', 0.4);
                break;
            case 'turn':
                 setTimeout(() => this.playTone(523.25, 0.1, 'sine', 0.5), 0); // C5
                 setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.5), 120); // G5
                break;
            case 'win':
                setTimeout(() => this.playTone(523.25, 0.1), 0); // C5
                setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
                setTimeout(() => this.playTone(783.99, 0.1), 200); // G5
                setTimeout(() => this.playTone(1046.50, 0.2), 300); // C6
                break;
            case 'lose':
                setTimeout(() => this.playTone(440, 0.15), 0); // A4
                setTimeout(() => this.playTone(330, 0.15), 150); // E4
                setTimeout(() => this.playTone(220, 0.25), 300); // A3
                break;
        }
    }

    public startBgm() {
        this.initAudioContext();
        if (!this.bgmEnabled || !this.audioContext || this.bgmNode) return; // Prevent starting if already playing or disabled
        
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.setValueAtTime(0.08, this.audioContext.currentTime); // Soft volume
        this.bgmGain.connect(this.audioContext.destination);

        this.bgmNode = this.audioContext.createOscillator();
        this.bgmNode.type = 'sine';
        this.bgmNode.connect(this.bgmGain);
        
        // Simple ambient melody sequence: A2, C3, D3, C3
        const sequence = [110, 130.81, 146.83, 130.81]; 
        let sequenceIndex = 0;
        
        this.bgmNode.frequency.setValueAtTime(sequence[sequenceIndex], this.audioContext.currentTime); // Set initial frequency
        this.bgmNode.start();

        const playNextNote = () => {
             if (!this.bgmNode || !this.audioContext) {
                 clearInterval(this.bgmInterval!); // Clear interval if audio context or node becomes null
                 this.bgmInterval = null;
                 return;
             }
             sequenceIndex = (sequenceIndex + 1) % sequence.length;
             // Smoothly transition to the next note frequency over 2 seconds
             this.bgmNode.frequency.linearRampToValueAtTime(sequence[sequenceIndex], this.audioContext.currentTime + 2);
        };
        
        // Use regular setInterval without window. for clarity
        this.bgmInterval = setInterval(playNextNote, 2000) as unknown as number; // Store interval ID, cast for TS
    }

    public stopBgm() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }

        if (this.bgmNode && this.bgmGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5); // Fade out volume
            this.bgmNode.stop(now + 0.5); // Stop oscillator after fade out
            this.bgmNode = null;
            this.bgmGain = null;
        }
    }

    public setSfxEnabled(enabled: boolean) {
        this.sfxEnabled = enabled;
    }

    public setBgmEnabled(enabled: boolean) {
        this.bgmEnabled = enabled;
        if (!enabled) {
            this.stopBgm();
        } else if (this.audioContext && !this.bgmNode) {
            // If BGM was disabled and re-enabled, and not currently playing, start it.
            // This handles cases where phase might not be 'Playing' yet but BGM is expected.
            // The App.tsx useEffect handles starting based on game phase.
        }
    }
}

// Export a singleton instance
export const soundManager = new SoundManager();

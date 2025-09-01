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
        gainNode.gain.setValueAtTime(vol, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

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
                 setTimeout(() => this.playTone(523.25, 0.1, 'sine', 0.5), 0);
                 setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.5), 120);
                break;
            case 'win':
                setTimeout(() => this.playTone(523.25, 0.1), 0);
                setTimeout(() => this.playTone(659.25, 0.1), 100);
                setTimeout(() => this.playTone(783.99, 0.1), 200);
                setTimeout(() => this.playTone(1046.50, 0.2), 300);
                break;
            case 'lose':
                setTimeout(() => this.playTone(440, 0.15), 0);
                setTimeout(() => this.playTone(330, 0.15), 150);
                setTimeout(() => this.playTone(220, 0.25), 300);
                break;
        }
    }

    public startBgm() {
        this.initAudioContext();
        if (!this.bgmEnabled || !this.audioContext || this.bgmNode) return;
        
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        this.bgmGain.connect(this.audioContext.destination);

        this.bgmNode = this.audioContext.createOscillator();
        this.bgmNode.type = 'sine';
        this.bgmNode.connect(this.bgmGain);
        
        const sequence = [110, 130.81, 146.83, 130.81]; 
        let sequenceIndex = 0;
        
        this.bgmNode.frequency.setValueAtTime(sequence[sequenceIndex], this.audioContext.currentTime);
        this.bgmNode.start();

        const playNextNote = () => {
             if (!this.bgmNode || !this.audioContext) {
                 clearInterval(this.bgmInterval!); 
                 this.bgmInterval = null;
                 return;
             }
             sequenceIndex = (sequenceIndex + 1) % sequence.length;
             this.bgmNode.frequency.linearRampToValueAtTime(sequence[sequenceIndex], this.audioContext.currentTime + 2);
        };
        
        this.bgmInterval = setInterval(playNextNote, 2000);
    }

    public stopBgm() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }

        if (this.bgmNode && this.bgmGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            this.bgmNode.stop(now + 0.5);
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

        }
    }
}

export const soundManager = new SoundManager();

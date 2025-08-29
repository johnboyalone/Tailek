import React, { useState } from 'react';
import type { GameSettings } from '../types';
import { Numpad } from './Numpad';
import { soundManager } from '../utils/sound';

interface SetupScreenProps {
  settings: GameSettings;
  playerName: string;
  onSetupComplete: (secret: string[]) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ settings, playerName, onSetupComplete }) => {
  const [currentDigits, setCurrentDigits] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleDigit = (digit: string) => {
    if (currentDigits.length < settings.digitCount) {
      setCurrentDigits([...currentDigits, digit]);
      setError('');
    }
  };

  const handleBackspace = () => {
    setCurrentDigits(currentDigits.slice(0, -1));
    setError('');
  };

  const confirmNumber = () => {
    if (currentDigits.length !== settings.digitCount) {
      setError(`กรุณากรอกตัวเลขให้ครบ ${settings.digitCount} หลัก`);
      return;
    }
    onSetupComplete(currentDigits);
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-3xl font-bold text-cyan-400 mb-2">ตั้งค่าตัวเลขลับ</h2>
        <p className="text-xl font-semibold text-slate-300 mb-6">{playerName}</p>
        
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <p className="text-slate-400 mb-6 text-sm">กรอกเลขลับ {settings.digitCount} หลัก (สามารถใช้เลขซ้ำได้)</p>
          
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: settings.digitCount }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-14 bg-slate-700 text-white text-3xl font-bold rounded-lg border-2 border-slate-600 flex items-center justify-center"
                aria-label={`Digit ${i + 1}`}
              >
                {currentDigits[i] || ''}
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 mb-4 h-5 text-sm">{error}</p>}
          
          <Numpad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onSubmit={confirmNumber}
            submitDisabled={currentDigits.length !== settings.digitCount}
            onPlayClick={() => soundManager.play('click')}
          />
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
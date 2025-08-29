import React from 'react';
import { soundManager } from '../utils/sound';
import { MusicNoteIcon, MusicNoteOffIcon, VolumeUpIcon, VolumeOffIcon } from './icons';
import type { GameState, Player } from '../types';

interface LobbyScreenProps {
  game: GameState;
  localPlayerId: string;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<GameState['settings']>) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  onSfxToggle: () => void;
  onBgmToggle: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ game, localPlayerId, onStartGame, onUpdateSettings, onAddBot, onRemovePlayer, sfxEnabled, bgmEnabled, onSfxToggle, onBgmToggle }) => {
  const isHost = game.hostId === localPlayerId;
  const lobbyPlayers = Object.values(game.players);
  const { playerCount, digitCount, turnTimeLimit } = game.settings;

  const timeOptions = [
      { label: 'ปิด', value: 0 }, { label: '15 วิ', value: 15 }, { label: '30 วิ', value: 30 },
      { label: '45 วิ', value: 45 }, { label: '60 วิ', value: 60 },
  ];
  
  const handlePlayerCountChange = (newCount: number) => {
    if (!isHost) return;
    onUpdateSettings({ playerCount: newCount });
  };
  
  const handleDigitCountChange = (newCount: number) => {
    if (!isHost) return;
    onUpdateSettings({ digitCount: newCount });
  };
  
  const handleTurnTimeLimitChange = (newLimit: number) => {
    if (!isHost) return;
    onUpdateSettings({ turnTimeLimit: newLimit });
  };

  const handleStart = () => {
    soundManager.play('click');
    onStartGame();
  }

  const SettingCard: React.FC<{ title: string; value: number; onValueChange: (value: number) => void; min: number; max: number; unit: string, disabled: boolean }> = ({ title, value, onValueChange, min, max, unit, disabled }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-inner w-full">
      <label className="block text-base font-medium text-slate-300 mb-2">{title}</label>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-cyan-400">{value} {unit}</span>
        <div className="flex space-x-2">
          <button
            onClick={() => { onValueChange(Math.max(min, value - 1)); soundManager.play('click'); }}
            disabled={disabled || value === min}
            className="w-9 h-9 rounded-full bg-slate-700 text-white text-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors flex items-center justify-center"
          >-</button>
          <button
            onClick={() => { onValueChange(Math.min(max, value + 1)); soundManager.play('click'); }}
            disabled={disabled || value === max}
            className="w-9 h-9 rounded-full bg-slate-700 text-white text-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors flex items-center justify-center"
          >+</button>
        </div>
      </div>
    </div>
  );
  
  const TimeSetting: React.FC<{ disabled: boolean }> = ({ disabled }) => (
      <div className="bg-slate-800 p-4 rounded-lg shadow-inner w-full">
        <label className="block text-base font-medium text-slate-300 mb-3">เวลาในการทาย</label>
        <div className="grid grid-cols-5 gap-2">
            {timeOptions.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => { if (!disabled) { handleTurnTimeLimitChange(opt.value); soundManager.play('click'); } }}
                    disabled={disabled}
                    className={`p-2 rounded-md text-sm font-semibold transition-colors ${turnTimeLimit === opt.value ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-700 text-slate-300'} ${!disabled ? 'hover:bg-slate-600' : 'disabled:cursor-not-allowed'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
      </div>
  );
  
  const SoundSettings: React.FC = () => (
      <div className="bg-slate-800 p-4 rounded-lg shadow-inner w-full flex justify-around">
        <button onClick={onBgmToggle} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            {bgmEnabled ? <MusicNoteIcon className="w-6 h-6 text-cyan-400" /> : <MusicNoteOffIcon className="w-6 h-6 text-slate-500" />}
            <span className="text-sm">เพลง</span>
        </button>
        <button onClick={onSfxToggle} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            {sfxEnabled ? <VolumeUpIcon className="w-6 h-6 text-cyan-400" /> : <VolumeOffIcon className="w-6 h-6 text-slate-500" />}
            <span className="text-sm">เสียง</span>
        </button>
      </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ทายเลขทายใจ</h1>
        <p className="text-slate-400 mt-2 text-md">Lobby</p>
      </div>
      <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="bg-slate-700 p-3 rounded-lg text-center">
            <p className="text-slate-300">รหัสห้อง: <span className="font-bold text-cyan-300 tracking-widest">{game.id}</span></p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg shadow-inner w-full space-y-2">
          <h3 className="text-base font-medium text-slate-300 mb-2 text-center">ผู้เล่นในห้อง ({lobbyPlayers.length}/{playerCount})</h3>
          {lobbyPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between bg-slate-700 p-2 rounded-md animate-fade-in">
                <span className={`font-semibold ${player.id === localPlayerId ? 'text-cyan-300' : 'text-white'}`}>{player.name}{player.id === game.hostId ? ` (โฮสต์)` : ''}</span>
                {(isHost && player.id !== localPlayerId) && (
                    <button onClick={() => onRemovePlayer(player.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">ลบ</button>
                )}
            </div>
          ))}
          {Array.from({ length: playerCount - lobbyPlayers.length }).map((_, index) => (
            <div key={`empty-${index}`} className="flex items-center justify-between bg-slate-700/50 p-2 rounded-md border-2 border-dashed border-slate-600">
                <span className="text-slate-500 italic text-sm">รอผู้เล่น...</span>
                {isHost && <button onClick={onAddBot} className="bg-cyan-600 text-white text-xs px-2 py-1 rounded hover:bg-cyan-500">เพิ่มบอท</button>}
            </div>
          ))}
        </div>

        <SettingCard title="จำนวนผู้เล่น" value={playerCount} onValueChange={handlePlayerCountChange} min={2} max={6} unit="คน" disabled={!isHost} />
        <SettingCard title="จำนวนหลัก" value={digitCount} onValueChange={handleDigitCountChange} min={3} max={6} unit="หลัก" disabled={!isHost} />
        <TimeSetting disabled={!isHost} />
        <SoundSettings />

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={lobbyPlayers.length < 2 || lobbyPlayers.length > playerCount}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transform active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            เริ่มเกม
          </button>
        ) : (
          <div className="w-full text-center bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-lg text-lg animate-pulse">
            รอโฮสต์เริ่มเกม...
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;
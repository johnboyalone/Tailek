import React, { useState } from 'react';
import { soundManager } from '../utils/sound';

interface JoinScreenProps {
  playerName: string;
  onJoinLobby: (roomCode: string) => void;
  onBack: () => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ playerName, onJoinLobby, onBack }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    soundManager.play('click');
    onJoinLobby(roomCode.trim().toUpperCase());
  };

  const handleBack = () => {
    soundManager.play('click');
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">เข้าร่วมห้อง</h1>
        <p className="text-slate-400 mt-2 text-md">คุณคือ: {playerName}</p>
      </div>
      <form onSubmit={handleJoin} className="w-full max-w-sm bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 space-y-6">
        <div>
          <label htmlFor="roomCode" className="block text-base font-medium text-slate-300 mb-2">รหัสห้อง</label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="กรอกรหัส 4 ตัว"
            className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-center text-xl tracking-[0.5em]"
            aria-label="Room Code"
            maxLength={4}
            autoCapitalize="characters"
          />
        </div>
        <div className="space-y-3">
          <button
            type="submit"
            disabled={roomCode.length < 4}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transform active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            เข้าร่วม
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transform active:scale-95 transition-transform"
          >
            กลับ
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinScreen;

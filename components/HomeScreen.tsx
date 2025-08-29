import React, { useState } from 'react';
import { soundManager } from '../utils/sound';

interface HomeScreenProps {
  onCreateLobby: (playerName: string) => void;
  onJoinRequest: (playerName: string) => void;
  error?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateLobby, onJoinRequest, error }) => {
  const [playerName, setPlayerName] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    soundManager.play('click');
    onCreateLobby(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim()) return;
    soundManager.play('click');
    onJoinRequest(playerName.trim());
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ทายเลขทายใจ</h1>
        <p className="text-slate-400 mt-2 text-md">Guess the Number, Guess the Mind</p>
      </div>
      <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 space-y-6">
        <div>
          <label htmlFor="playerName" className="block text-base font-medium text-slate-300 mb-2">ชื่อของคุณ</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="กรอกชื่อของคุณ..."
            className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            aria-label="Player Name"
            maxLength={15}
          />
        </div>
        
        {error && <p className="text-red-400 text-center text-sm">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={handleCreate}
            disabled={!playerName.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transform active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            สร้างห้อง
          </button>
          <button
            onClick={handleJoin}
            disabled={!playerName.trim()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transform active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            เข้าร่วมห้อง
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
import React from 'react';
import type { Player } from '../types';
import { TrophyIcon } from './icons';
import { soundManager } from '../utils/sound';

interface GameOverScreenProps {
  players: Player[];
  winner: Player | null;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ players, winner, onRestart }) => {

  const handleRestart = () => {
      soundManager.play('click');
      onRestart();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 mb-3">
          จบเกม!
        </h2>
        
        {winner && (
          <>
            <TrophyIcon className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <p className="text-lg text-slate-300 mb-1">ผู้ชนะคือ</p>
            <p className="text-3xl font-bold text-white mb-6">{winner.name}</p>
          </>
        )}
        
        <hr className="my-4 border-slate-600/50" />

        <h3 className="text-xl font-bold text-slate-300 mb-3">สรุปผลฉายา</h3>
        <div className="space-y-2 text-left min-h-[15rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600">
            {players.map((p) => (
                <div key={p.id} className={`p-2 rounded-lg flex justify-between items-center transition-colors animate-fade-in ${p.id === winner?.id ? 'bg-yellow-500/20' : 'bg-slate-700/50'}`}>
                    <span className={`font-bold text-sm ${p.id === winner?.id ? 'text-yellow-300' : 'text-slate-200'}`}>{p.name}</span>
                    <span className={`text-xs italic text-right ${p.id === winner?.id ? 'text-yellow-400' : 'text-slate-400'}`}>{p.title || ' '}</span>
                </div>
            ))}
        </div>

        <button
          onClick={handleRestart}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg transform active:scale-95 transition-transform animate-fade-in"
        >
          กลับไปหน้าแรก
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
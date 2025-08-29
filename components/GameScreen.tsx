import React, { useState, useEffect, useRef, useId } from 'react';
import type { Player, GameState } from '../types';
import { CheckIcon, RefreshIcon, MusicNoteIcon, MusicNoteOffIcon, VolumeUpIcon, VolumeOffIcon } from './icons';
import { Numpad } from './Numpad';
import { soundManager } from '../utils/sound';

interface AnimatedArrowProps {
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
}

const AnimatedArrow: React.FC<AnimatedArrowProps> = ({ start, end }) => {
    const uniqueId = useId();
    const pathId = `arrow-path-${uniqueId}`;
    const gradientId = `arrow-grad-${uniqueId}`;

    if (!start || !end || (start.x === end.x && start.y === end.y)) {
        return null;
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pathLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const charWidth = 18; 
    const charCount = Math.max(1, Math.floor(pathLength / charWidth));
    const arrowText = '>'.repeat(charCount);
    
    const gradientWidth = 80;

    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20, overflow: 'visible' }}>
            <g transform={`translate(${start.x}, ${start.y}) rotate(${angle})`}>
                <defs>
                    <path id={pathId} d={`M 0,0 L ${pathLength},0`} fill="none" stroke="none" />
                    <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={gradientWidth} y2={0}>
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
                        <stop offset="50%" stopColor="#fde047" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            from={`0 0`}
                            to={`${pathLength} 0`}
                            dur="1.5s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>
                </defs>
                <text
                    dy="6"
                    fill={`url(#${gradientId})`}
                    fontSize="24"
                    fontWeight="bold"
                    letterSpacing="-2"
                    style={{ filter: `drop-shadow(0 0 6px #f97316)` }}
                >
                    <textPath href={`#${pathId}`}>
                        {arrowText}
                    </textPath>
                </text>
            </g>
        </svg>
    );
};


interface GameScreenProps {
  game: GameState;
  onSubmitGuess: (guess: string[]) => void;
  localPlayerId: string;
  remainingTime: number;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  onSfxToggle: () => void;
  onBgmToggle: () => void;
  onSendMessage: (message: string) => void;
}

const GuessHistoryItem: React.FC<{ guess: import('../types').Guess }> = ({ guess }) => (
    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50">
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <span className="font-mono tracking-wider text-slate-300">{guess.value}</span>
            <span className="text-slate-400 truncate" title={guess.guesserName}>
                by {guess.guesserName}
            </span>
        </div>
        <div className="flex items-center gap-2 pl-2">
            <div className="flex items-center gap-1 text-green-400" title="ถูกตำแหน่ง">
                <CheckIcon className="w-3 h-3" />
                <span>{guess.correct}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400" title="ถูกเลขแต่ผิดตำแหน่ง">
                <RefreshIcon className="w-3 h-3" />
                <span>{guess.misplaced}</span>
            </div>
        </div>
    </div>
);

const PlayerCard: React.FC<{ 
    player: Player; 
    isCurrentGuesser: boolean; 
    isTarget: boolean; 
    localPlayerId: string;
    refProp: (el: HTMLDivElement | null) => void;
}> = ({ player, isCurrentGuesser, isTarget, localPlayerId, refProp }) => {
    const [visibleMessage, setVisibleMessage] = useState<{ text: string; timestamp: number } | null>(null);

    useEffect(() => {
        if (player.lastMessage) {
            setVisibleMessage(player.lastMessage);
            const timer = setTimeout(() => {
                 setVisibleMessage(current => {
                    if (current && current.timestamp === player.lastMessage?.timestamp) {
                        return null;
                    }
                    return current;
                });
            }, 5000); // Show for 5 seconds

            return () => clearTimeout(timer);
        }
    }, [player.lastMessage]);
    
    let borderColor = 'border-slate-700';
    if (isCurrentGuesser) borderColor = 'border-cyan-500 ring-1 ring-cyan-500/50';
    if (isTarget) borderColor = 'border-red-500 ring-1 ring-red-500/50';
    if (player.isFound) borderColor = 'border-slate-600';

    return (
        <div ref={refProp} className={`relative bg-slate-800 rounded-lg shadow-lg p-3 border-2 transition-all duration-300 flex flex-col ${borderColor} ${player.isFound ? 'opacity-50' : ''}`}>
            {visibleMessage && (
                <div className="absolute -top-2 left-1/2 w-max max-w-[150px] bg-slate-600 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-30 animate-chat-bubble break-words text-center">
                    {visibleMessage.text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-600"></div>
                </div>
            )}
            <h3 className="font-bold text-base mb-1 text-center truncate">
                <span className={player.id === localPlayerId ? 'text-cyan-300' : 'text-white'}>{player.name}</span>
            </h3>
            <div className="h-24 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 flex-grow">
                {player.history.length === 0 ? (
                    <p className="text-slate-500 text-center text-xs pt-8">ยังไม่มีการทาย</p>
                ) : (
                    [...player.history].reverse().map((g, i) => <GuessHistoryItem key={i} guess={g} />)
                )}
            </div>
            {player.isFound && (
                <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-lg">
                    <span className="text-xl font-bold text-green-400 font-mono tracking-widest">{player.secretNumber.join(' ')}</span>
                </div>
            )}
        </div>
    );
};

const GameScreen: React.FC<GameScreenProps> = ({ game, onSubmitGuess, localPlayerId, remainingTime, sfxEnabled, bgmEnabled, onSfxToggle, onBgmToggle, onSendMessage }) => {
    const [currentGuess, setCurrentGuess] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [arrowCoords, setArrowCoords] = useState<AnimatedArrowProps>({ start: null, end: null });
    const [shoutedGuess, setShoutedGuess] = useState<{ value: string; x: number; y: number } | null>(null);
    const [chatInput, setChatInput] = useState('');

    const mainContainerRef = useRef<HTMLDivElement>(null);
    const playerCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    
    const { players, settings, currentPlayerId, targetPlayerId, lastBotGuess } = game;

    const isMyTurn = currentPlayerId === localPlayerId;

    useEffect(() => {
        if (isMyTurn) {
            setCurrentGuess([]);
            setError('');
            soundManager.play('turn');
        }
    }, [currentPlayerId, isMyTurn]);
    
    useEffect(() => {
        const updateCoords = () => {
            if (!currentPlayerId || !targetPlayerId) return;

            const container = mainContainerRef.current;
            const guesserEl = playerCardRefs.current[currentPlayerId];
            const targetEl = playerCardRefs.current[targetPlayerId];

            if (container && guesserEl && targetEl) {
                const containerRect = container.getBoundingClientRect();
                const guesserRect = guesserEl.getBoundingClientRect();
                const targetRect = targetEl.getBoundingClientRect();

                const start = {
                    x: guesserRect.left + guesserRect.width / 2 - containerRect.left,
                    y: guesserRect.top + guesserRect.height / 2 - containerRect.top,
                };
                const end = {
                    x: targetRect.left + targetRect.width / 2 - containerRect.left,
                    y: targetRect.top + targetRect.height / 2 - containerRect.top,
                };
                setArrowCoords({ start, end });
            } else {
                setArrowCoords({start: null, end: null});
            }
        };
        const animationFrameId = requestAnimationFrame(updateCoords);
        window.addEventListener('resize', updateCoords);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', updateCoords)
        };
    }, [currentPlayerId, targetPlayerId, players]);

    useEffect(() => {
        if (lastBotGuess && lastBotGuess.guesserId !== localPlayerId) {
            const container = mainContainerRef.current;
            const guesserEl = playerCardRefs.current[lastBotGuess.guesserId];

            if (container && guesserEl) {
                const containerRect = container.getBoundingClientRect();
                const guesserRect = guesserEl.getBoundingClientRect();

                const x = guesserRect.left + guesserRect.width / 2 - containerRect.left;
                const y = guesserRect.top - containerRect.top; // Position above the card

                setShoutedGuess({ value: lastBotGuess.guess.join(''), x, y });
                
                const timer = setTimeout(() => {
                    setShoutedGuess(null);
                }, 2000); // Animation duration

                return () => clearTimeout(timer);
            }
        }
    }, [lastBotGuess, localPlayerId]);

    const handleDigit = (digit: string) => {
        if (currentGuess.length < settings.digitCount) {
            setCurrentGuess([...currentGuess, digit]);
            setError('');
        }
    };

    const handleBackspace = () => {
        setCurrentGuess(currentGuess.slice(0, -1));
        setError('');
    };

    const handleSubmit = () => {
        if (currentGuess.length !== settings.digitCount) {
            setError(`กรุณากรอกตัวเลขให้ครบ ${settings.digitCount} หลัก`);
            return;
        }
        soundManager.play('guess');
        onSubmitGuess(currentGuess);
        setCurrentGuess([]);
        setError('');
    };
    
    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        onSendMessage(chatInput.trim());
        setChatInput('');
        soundManager.play('click');
    };

    const playerList = Object.values(players);
    const currentPlayer = players[currentPlayerId || ''];
    const targetPlayer = players[targetPlayerId || ''];
    const gridLayoutClass = playerList.length > 4 ? 'grid-cols-3' : 'grid-cols-2';
    
    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col items-center p-2 overflow-hidden">
            <header className="text-center mb-2 flex-shrink-0 w-full relative">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ทายเลขทายใจ</h1>
                 <div className="absolute top-1 right-2 flex items-center space-x-3">
                    {settings.turnTimeLimit > 0 && (
                        <div className="bg-slate-800/80 px-3 py-1 rounded-full">
                            <p className={`text-lg font-mono font-bold ${remainingTime <= 5 ? 'text-red-500 animate-ping' : 'text-yellow-400'}`}>
                                {remainingTime}
                            </p>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <button onClick={onBgmToggle} className="text-slate-400 hover:text-white transition-colors">
                            {bgmEnabled ? <MusicNoteIcon className="w-5 h-5" /> : <MusicNoteOffIcon className="w-5 h-5" />}
                        </button>
                         <button onClick={onSfxToggle} className="text-slate-400 hover:text-white transition-colors">
                            {sfxEnabled ? <VolumeUpIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <p className="text-slate-300 text-sm mt-1 h-5">
                    เป้าหมาย: <span className="font-bold text-red-400">{targetPlayer?.name}</span> | 
                    ผู้ทาย: <span className="font-bold text-cyan-400">{currentPlayer?.name}</span>
                </p>
            </header>

            <main ref={mainContainerRef} className={`relative flex-grow w-full max-w-md grid ${gridLayoutClass} gap-2 py-2`}>
                 <AnimatedArrow key={`${currentPlayerId}-${targetPlayerId}`} start={arrowCoords.start} end={arrowCoords.end} />
                {playerList.map(player => (
                    <PlayerCard
                        key={player.id}
                        player={player}
                        isCurrentGuesser={player.id === currentPlayerId}
                        isTarget={player.id === targetPlayerId}
                        localPlayerId={localPlayerId}
                        refProp={(el) => { playerCardRefs.current[player.id] = el; }}
                    />
                ))}
                {shoutedGuess && (
                    <div
                        className="absolute text-3xl font-bold font-mono tracking-widest text-yellow-300 pointer-events-none animate-shout"
                        style={{
                            left: `${shoutedGuess.x}px`,
                            top: `${shoutedGuess.y}px`,
                            transform: 'translateX(-50%)', // Center it horizontally
                            zIndex: 30,
                            textShadow: '0 0 8px rgba(253, 224, 71, 0.7)'
                        }}
                    >
                        {shoutedGuess.value}
                    </div>
                )}
            </main>

            <footer className="flex-shrink-0 w-full max-w-sm mx-auto pt-2">
                <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-2xl relative">
                    { !isMyTurn && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                            <p className="text-lg text-slate-300 animate-pulse">
                                รอตาของ {currentPlayer?.name}...
                            </p>
                        </div>
                    )}
                    <p className="text-center text-slate-300 mb-2 h-5 text-sm">
                        {isMyTurn ? `ทายเลขของ ${targetPlayer?.name}` : ' '}
                    </p>
                    <div className="flex justify-center gap-2 mb-3">
                        {Array.from({ length: settings.digitCount }).map((_, i) => (
                             <div
                                key={i}
                                className="w-12 h-14 bg-slate-700 text-white text-3xl font-bold text-center rounded-lg border-2 border-slate-600 flex items-center justify-center"
                                aria-label={`Guessed Digit ${i + 1}`}
                             >
                               {currentGuess[i] || ''}
                             </div>
                        ))}
                    </div>
                     {error && <p className="text-red-400 text-center mb-2 h-5 text-sm">{error}</p>}
                    <Numpad
                        onDigit={handleDigit}
                        onBackspace={handleBackspace}
                        onSubmit={handleSubmit}
                        submitDisabled={currentGuess.length !== settings.digitCount}
                        onPlayClick={() => soundManager.play('click')}
                    />
                    <div className="mt-3">
                        <form onSubmit={handleSendChat}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="พิมพ์ข้อความ..."
                                    className="flex-grow bg-slate-700 border-2 border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm h-10"
                                    maxLength={50}
                                    aria-label="Chat message"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                    aria-label="Send chat"
                                >
                                    ส่ง
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GameScreen;
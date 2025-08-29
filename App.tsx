import React, { useState, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, deleteField, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { db } from './utils/firebase';
import { GamePhase } from './types';
import type { Player, GameSettings, Guess, GameState } from './types';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import JoinScreen from './components/JoinScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import { WINNING_TITLES, LOSING_TITLES } from './utils/titles';
import { soundManager } from './utils/sound';

const generateNumber = (count: number): string[] => {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(digits[Math.floor(Math.random() * digits.length)]);
    }
    return result;
};

const calculateNextTurn = (
    game: GameState
) => {
    const { players, turnOrder, currentPlayerId, targetPlayerId } = game;
    const targetPlayer = players[targetPlayerId!];
    const targetWasJustFound = targetPlayer.isFound;

    const activePlayers = turnOrder.filter(id => !players[id].isFound);
    if (activePlayers.length <= 1) {
        return null; // Game over
    }
    
    const guessersForCurrentTarget = turnOrder.filter(id => activePlayers.includes(id) && id !== targetPlayerId);
    
    const lastGuesserIndex = guessersForCurrentTarget.indexOf(currentPlayerId!);

    const isLastGuesserOfRound = lastGuesserIndex === guessersForCurrentTarget.length - 1;
    
    if (targetWasJustFound || isLastGuesserOfRound) {
        const lastTargetTurnIndex = turnOrder.indexOf(targetPlayerId!);
        let nextTargetId = '';
        let currentIndex = lastTargetTurnIndex;
        do {
            currentIndex = (currentIndex + 1) % turnOrder.length;
            const potentialTargetId = turnOrder[currentIndex];
            if (activePlayers.includes(potentialTargetId)) {
                nextTargetId = potentialTargetId;
            }
        } while (nextTargetId === '');

        const guessersForNewTarget = turnOrder.filter(id => activePlayers.includes(id) && id !== nextTargetId);
        const nextGuesserId = guessersForNewTarget[0];
        
        return { nextGuesserId, nextTargetId };

    } else {
        const nextGuesserId = guessersForCurrentTarget[lastGuesserIndex + 1];
        const nextTargetId = targetPlayerId!;
        return { nextGuesserId, nextTargetId };
    }
};

const App: React.FC = () => {
    const [game, setGame] = useState<GameState | null>(null);
    const [localPlayerId, setLocalPlayerId] = useState<string | null>(() => sessionStorage.getItem('localPlayerId'));
    const [roomId, setRoomId] = useState<string | null>(() => sessionStorage.getItem('roomId'));
    const [error, setError] = useState<string>('');
    const [sfxEnabled, setSfxEnabled] = useState(() => localStorage.getItem('sfxEnabled') !== 'false');
    const [bgmEnabled, setBgmEnabled] = useState(() => localStorage.getItem('bgmEnabled') !== 'false');
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        soundManager.setSfxEnabled(sfxEnabled);
        localStorage.setItem('sfxEnabled', String(sfxEnabled));
    }, [sfxEnabled]);

    useEffect(() => {
        soundManager.setBgmEnabled(bgmEnabled);
        localStorage.setItem('bgmEnabled', String(bgmEnabled));
        if (game?.phase === GamePhase.Playing && bgmEnabled) {
            soundManager.startBgm();
        } else {
            soundManager.stopBgm();
        }
    }, [bgmEnabled, game?.phase]);

    useEffect(() => {
        if (!roomId) {
            setGame(null);
            return;
        }
        const gameDocRef = doc(db, 'games', roomId);
        const unsubscribe = onSnapshot(gameDocRef as any, (docSnap: DocumentSnapshot<DocumentData>) => {
            if (docSnap.exists()) {
                const gameData = docSnap.data() as GameState;
                setGame(gameData);
                setError('');
                sessionStorage.setItem('roomId', roomId);
                if (localPlayerId && gameData.players[localPlayerId]) {
                    sessionStorage.setItem('localPlayerId', localPlayerId);
                }
            } else {
                setError(`ไม่พบห้อง ${roomId}`);
                handleBackToHome();
            }
        }, (err: Error) => {
            console.error("Firebase subscription error:", err);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
            handleBackToHome();
        });

        return () => unsubscribe();
    }, [roomId, localPlayerId]);

    useEffect(() => {
        if (game?.phase === GamePhase.Playing && game.settings.turnTimeLimit > 0 && game.currentPlayerId === localPlayerId) {
            setRemainingTime(game.settings.turnTimeLimit);
            const timer = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTurnTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [game?.phase, game?.settings?.turnTimeLimit, game?.currentPlayerId, localPlayerId]);
    
    useEffect(() => {
        if (!game || game.phase !== GamePhase.Playing || game.hostId !== localPlayerId) return;

        const currentPlayer = game.players[game.currentPlayerId!];
        if (currentPlayer?.isBot) {
            const botThinkTime = 1500 + Math.random() * 1000;
            const timer = setTimeout(() => {
                const botGuess = generateNumber(game.settings.digitCount);
                handleSubmitGuess(botGuess, true);
            }, botThinkTime);
            return () => clearTimeout(timer);
        }
    }, [game?.currentPlayerId, game?.phase, game?.hostId, localPlayerId]);

    const handleCreateLobby = async (playerName: string) => {
        const newRoomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newPlayerId = doc(collection(db, 'temp')).id;
        
        const hostPlayer: Player = {
            id: newPlayerId, name: playerName, secretNumber: [], isFound: false, history: []
        };
        
        const initialSettings: GameSettings = { playerCount: 2, digitCount: 4, turnTimeLimit: 30 };
        
        const newGame: GameState = {
            id: newRoomCode,
            phase: GamePhase.Lobby,
            settings: initialSettings,
            players: { [newPlayerId]: hostPlayer },
            hostId: newPlayerId,
            turnOrder: [],
            createdAt: Date.now()
        };

        try {
            await setDoc(doc(db, "games", newRoomCode), newGame);
            setRoomId(newRoomCode);
            setLocalPlayerId(newPlayerId);
        } catch (err) {
            console.error("Error creating lobby:", err);
            setError("ไม่สามารถสร้างห้องได้ โปรดลองอีกครั้ง");
        }
    };

    const handleJoinLobby = async (playerName: string, roomCode: string) => {
        const gameDocRef = doc(db, 'games', roomCode);
        try {
            const gameSnap = await getDoc(gameDocRef);
            if (!gameSnap.exists()) {
                setError("ไม่พบห้องนี้");
                return;
            }
            const gameData = gameSnap.data() as GameState;
            if (gameData.phase !== GamePhase.Lobby) {
                setError("ไม่สามารถเข้าร่วมห้องที่เริ่มเกมไปแล้วได้");
                return;
            }
            if (Object.keys(gameData.players).length >= gameData.settings.playerCount) {
                setError("ห้องเต็มแล้ว");
                return;
            }

            const newPlayerId = doc(collection(db, 'temp')).id;
            const newPlayer: Player = { id: newPlayerId, name: playerName, secretNumber: [], isFound: false, history: [] };
            
            await updateDoc(gameDocRef, { [`players.${newPlayerId}`]: newPlayer });

            setRoomId(roomCode);
            setLocalPlayerId(newPlayerId);

        } catch (err) {
            console.error("Error joining lobby:", err);
            setError("เกิดข้อผิดพลาดในการเข้าร่วมห้อง");
        }
    };
    
    const handleBackToHome = () => {
        setRoomId(null);
        setLocalPlayerId(null);
        setGame(null);
        setError('');
        sessionStorage.removeItem('roomId');
        sessionStorage.removeItem('localPlayerId');
    };
    
    const handleStartGame = async () => {
        if (!game || game.hostId !== localPlayerId) return;
        
        const currentPlayersCount = Object.keys(game.players).length;
        const botsToAddCount = game.settings.playerCount - currentPlayersCount;
        let finalPlayers = { ...game.players };

        for(let i = 0; i < botsToAddCount; i++) {
            const botId = doc(collection(db, 'temp')).id;
            const botPlayer: Player = {
                id: botId,
                name: `Bot ${i + 1}`,
                secretNumber: generateNumber(game.settings.digitCount),
                isFound: false,
                history: [],
                isBot: true,
                isReady: true
            };
            finalPlayers[botId] = botPlayer;
        }
        
        await updateDoc(doc(db, 'games', game.id), {
            players: finalPlayers,
            phase: GamePhase.Setup,
        });
    };
    
    const handleSetupComplete = async (secret: string[]) => {
        if (!game || !localPlayerId) return;

        await updateDoc(doc(db, 'games', game.id), {
            [`players.${localPlayerId}.secretNumber`]: secret,
            [`players.${localPlayerId}.isReady`]: true,
        });
    };
    
    useEffect(() => {
        if (game?.phase !== GamePhase.Setup || game.hostId !== localPlayerId) return;

        const allPlayersReady = Object.values(game.players).every(p => p.isReady);

        if (allPlayersReady) {
            const turnOrder = Object.keys(game.players).sort(() => Math.random() - 0.5);
            const initialTargetId = turnOrder.find(id => id !== turnOrder[0]);

            updateDoc(doc(db, 'games', game.id), {
                phase: GamePhase.Playing,
                turnOrder,
                currentPlayerId: turnOrder[0],
                targetPlayerId: initialTargetId
            });
        }
    }, [game?.phase, game?.players, game?.hostId, localPlayerId]);

    const handleSubmitGuess = useCallback(async (guess: string[], isBotGuess: boolean = false) => {
        if (!game || (!isBotGuess && game.currentPlayerId !== localPlayerId)) return;
        
        const { currentPlayerId, targetPlayerId, settings, players } = game;
        const guesserId = currentPlayerId!;
        const currentTargetId = targetPlayerId!;

        const targetPlayer = players[currentTargetId];
        const guesserPlayer = players[guesserId];

        if (!targetPlayer || targetPlayer.isFound || !guesserPlayer) return;

        const secret = [...targetPlayer.secretNumber];
        const guessAttempt = [...guess];
        let correct = 0, misplaced = 0;
        
        for (let i = 0; i < settings.digitCount; i++) {
            if (secret[i] === guessAttempt[i]) {
                correct++; secret[i] = 'C'; guessAttempt[i] = 'C';
            }
        }
        for (let i = 0; i < settings.digitCount; i++) {
            if (guessAttempt[i] === 'C') continue;
            const misplacedIndex = secret.indexOf(guessAttempt[i]);
            if (misplacedIndex !== -1) {
                misplaced++; secret[misplacedIndex] = 'M';
            }
        }

        const newGuess: Guess = { value: guess.join(''), correct, misplaced, guesserId, guesserName: guesserPlayer.name };
        const playerFound = correct === settings.digitCount;
        
        const updatedGameForCalc: GameState = {
            ...game,
            players: {
                ...game.players,
                [currentTargetId]: {
                    ...targetPlayer,
                    history: [...targetPlayer.history, newGuess],
                    isFound: playerFound || targetPlayer.isFound
                }
            }
        };

        const activePlayersCount = Object.values(updatedGameForCalc.players).filter(p => !p.isFound).length;

        if (activePlayersCount <= 1) {
            const finalWinner = Object.values(updatedGameForCalc.players).find(p => !p.isFound);
            let availableLosingTitles = [...LOSING_TITLES].sort(() => 0.5 - Math.random());
            let playersWithTitles = { ...updatedGameForCalc.players };
            Object.keys(playersWithTitles).forEach(pid => {
                 playersWithTitles[pid].title = pid === finalWinner?.id
                    ? WINNING_TITLES[Math.floor(Math.random() * WINNING_TITLES.length)]
                    : (availableLosingTitles.pop() || "ผู้ร่วมชะตากรรม");
            });

            await updateDoc(doc(db, 'games', game.id), {
                phase: GamePhase.GameOver,
                players: playersWithTitles,
                winnerId: finalWinner?.id || null,
                [`players.${currentTargetId}.history`]: [...targetPlayer.history, newGuess],
                [`players.${currentTargetId}.isFound`]: playerFound || targetPlayer.isFound
            });
            soundManager.play(finalWinner?.id === localPlayerId ? 'win' : 'lose');
        } else {
            const nextTurn = calculateNextTurn(updatedGameForCalc);
            await updateDoc(doc(db, 'games', game.id), {
                currentPlayerId: nextTurn!.nextGuesserId,
                targetPlayerId: nextTurn!.nextTargetId,
                lastBotGuess: guesserPlayer.isBot ? { guesserId, guess } : deleteField(),
                [`players.${currentTargetId}.history`]: [...targetPlayer.history, newGuess],
                [`players.${currentTargetId}.isFound`]: playerFound || targetPlayer.isFound
            });
        }
    }, [game, localPlayerId]);
    
    const handleTurnTimeout = useCallback(async () => {
        if (!game || game.currentPlayerId !== localPlayerId || game.settings.turnTimeLimit <= 0) return;
        
        const nextTurn = calculateNextTurn(game);
        if (nextTurn) {
             await updateDoc(doc(db, 'games', game.id), {
                currentPlayerId: nextTurn.nextGuesserId,
                targetPlayerId: nextTurn.nextTargetId
             });
        }
    }, [game, localPlayerId]);
    
    const handleSendMessage = async (message: string) => {
        if (!game || !localPlayerId) return;
        await updateDoc(doc(db, 'games', game.id), {
            [`players.${localPlayerId}.lastMessage`]: { text: message, timestamp: Date.now() }
        });
    };

    const handleUpdateSettings = async (newSettings: Partial<GameSettings>) => {
        if (!game || game.hostId !== localPlayerId) return;
        const settingsUpdate: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(newSettings)) {
            settingsUpdate[`settings.${key}`] = value;
        }
        await updateDoc(doc(db, 'games', game.id), settingsUpdate);
    };

    const handleAddBot = async () => {
        if (!game || game.hostId !== localPlayerId || Object.keys(game.players).length >= game.settings.playerCount) return;
        const botId = doc(collection(db, 'temp')).id;
        const botPlayer: Player = {
            id: botId,
            name: `Bot ${Object.values(game.players).filter(p => p.isBot).length + 1}`,
            secretNumber: [], isFound: false, history: [], isBot: true
        };
        await updateDoc(doc(db, 'games', game.id), { [`players.${botId}`]: botPlayer });
    };

    const handleRemovePlayer = async (playerId: string) => {
        if (!game || game.hostId !== localPlayerId) return;
        await updateDoc(doc(db, 'games', game.id), { [`players.${playerId}`]: deleteField() });
    };

    const renderContent = () => {
        if (!game) {
            if (roomId) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">กำลังโหลดห้อง...</div>
            return <HomeScreen onCreateLobby={handleCreateLobby} onJoinRequest={() => setGame({ phase: GamePhase.Join } as GameState)} error={error} />;
        }

        switch (game.phase) {
            case GamePhase.Join:
                return <JoinScreen onJoinLobby={handleJoinLobby} onBack={() => setGame(null)} error={error} />;
            case GamePhase.Lobby:
                return <LobbyScreen 
                            game={game} localPlayerId={localPlayerId!} 
                            onStartGame={handleStartGame} 
                            onUpdateSettings={handleUpdateSettings}
                            onAddBot={handleAddBot} onRemovePlayer={handleRemovePlayer}
                            sfxEnabled={sfxEnabled} bgmEnabled={bgmEnabled}
                            onSfxToggle={() => setSfxEnabled(p => !p)} onBgmToggle={() => setBgmEnabled(p => !p)}
                        />;
            case GamePhase.Setup:
                const localPlayer = game.players[localPlayerId!];
                return <SetupScreen 
                            settings={game.settings} 
                            playerName={localPlayer?.name || ''}
                            isReady={localPlayer?.isReady || false}
                            allPlayersReady={Object.values(game.players).every(p => p.isReady)}
                            onSetupComplete={handleSetupComplete}
                        />;
            case GamePhase.Playing:
                return <GameScreen 
                            game={game}
                            localPlayerId={localPlayerId!}
                            onSubmitGuess={handleSubmitGuess}
                            onSendMessage={handleSendMessage}
                            remainingTime={remainingTime}
                            sfxEnabled={sfxEnabled} bgmEnabled={bgmEnabled}
                            onSfxToggle={() => setSfxEnabled(p => !p)} onBgmToggle={() => setBgmEnabled(p => !p)}
                        />;
            case GamePhase.GameOver:
                 return <GameOverScreen 
                            players={Object.values(game.players)} 
                            winner={game.players[game.winnerId!] || null} 
                            onRestart={handleBackToHome}
                        />;
            case GamePhase.Home:
            default:
                 return <HomeScreen onCreateLobby={handleCreateLobby} onJoinRequest={() => setGame({ phase: GamePhase.Join } as GameState)} error={error} />;
        }
    };

    return <div className="bg-slate-900">{renderContent()}</div>;
};

export default App;

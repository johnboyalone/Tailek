import React, { useState, useCallback, useEffect } from 'react';
import { GamePhase } from './types';
import type { Player, GameSettings, Guess } from './types';
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
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(digits[Math.floor(Math.random() * digits.length)]);
    }
    return result;
};

const LOCAL_PLAYER_ID = 0;

const calculateNextTurn = (
    allPlayers: Player[],
    lastGuesserId: number,
    lastTargetId: number,
    targetWasJustFound: boolean
) => {
    const activePlayers = allPlayers.filter(p => !p.isFound);
    if (activePlayers.length <= 1) {
        return null; // Game over
    }
    const activePlayerIds = activePlayers.map(p => p.id);

    // 1. Determine the guessers for the current target, maintaining original player order.
    const guessersForCurrentTarget = allPlayers
        .map(p => p.id)
        .filter(id => activePlayerIds.includes(id) && id !== lastTargetId);

    // 2. Find the index of the last guesser in this round's sequence.
    const lastGuesserIndex = guessersForCurrentTarget.indexOf(lastGuesserId);

    // 3. Check if the round should end.
    const isLastGuesserOfRound = lastGuesserIndex === guessersForCurrentTarget.length - 1;
    
    if (targetWasJustFound || isLastGuesserOfRound) {
        // --- START A NEW ROUND ---
        // a. Find the next target. It's the next active player after lastTargetId in the original allPlayers order.
        const lastTargetOriginalIndex = allPlayers.findIndex(p => p.id === lastTargetId);
        let nextTargetId = -1;
        let currentIndex = lastTargetOriginalIndex;
        // Loop until a valid next target is found
        do {
            currentIndex = (currentIndex + 1) % allPlayers.length;
            if (activePlayerIds.includes(allPlayers[currentIndex].id)) {
                nextTargetId = allPlayers[currentIndex].id;
            }
        } while (nextTargetId === -1);

        // b. Find the first guesser for this new target. It's the first active player that is not the new target.
        const guessersForNewTarget = allPlayers
            .map(p => p.id)
            .filter(id => activePlayerIds.includes(id) && id !== nextTargetId);
        
        const nextGuesserId = guessersForNewTarget[0];

        return { nextGuesserId, nextTargetId };
    } else {
        // --- CONTINUE CURRENT ROUND ---
        // The next guesser is simply the next one in the list.
        const nextGuesserId = guessersForCurrentTarget[lastGuesserIndex + 1];
        const nextTargetId = lastTargetId; // Target stays the same.
        return { nextGuesserId, nextTargetId };
    }
};


const App: React.FC = () => {
    const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.Home);
    const [settings, setSettings] = useState<GameSettings | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [botConfigs, setBotConfigs] = useState<Array<{ name: string }>>([]);
    const [localPlayerName, setLocalPlayerName] = useState<string>('');
    const [isHost, setIsHost] = useState(false);
    const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
    const [targetPlayerId, setTargetPlayerId] = useState<number>(1);
    const [winner, setWinner] = useState<Player | null>(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const [lastBotGuess, setLastBotGuess] = useState<{ guesserId: number, guess: string[] } | null>(null);
    const [sfxEnabled, setSfxEnabled] = useState(() => localStorage.getItem('sfxEnabled') !== 'false');
    const [bgmEnabled, setBgmEnabled] = useState(() => localStorage.getItem('bgmEnabled') !== 'false');

    useEffect(() => {
        soundManager.setSfxEnabled(sfxEnabled);
        localStorage.setItem('sfxEnabled', String(sfxEnabled));
    }, [sfxEnabled]);

    useEffect(() => {
        soundManager.setBgmEnabled(bgmEnabled);
        localStorage.setItem('bgmEnabled', String(bgmEnabled));

        if (gamePhase === GamePhase.Playing && bgmEnabled) {
            soundManager.startBgm();
        } else {
            soundManager.stopBgm();
        }
    }, [bgmEnabled, gamePhase]);
    
    const handleSfxToggle = () => setSfxEnabled(prev => !prev);
    const handleBgmToggle = () => setBgmEnabled(prev => !prev);
    
    const handleSendMessage = (playerId: number, message: string) => {
        setPlayers(currentPlayers => 
            currentPlayers.map(p => 
                p.id === playerId 
                ? { ...p, lastMessage: { text: message, timestamp: Date.now() } } 
                : p
            )
        );
        // This is where a call to a backend/Firebase would be made for online play.
    };

    const handleSubmitGuess = useCallback((guess: string[], guesserId: number, currentTargetId: number, playersState: Player[]) => {
        if (!settings) return;
        const targetPlayer = playersState.find(p => p.id === currentTargetId);
        const guesserPlayer = playersState.find(p => p.id === guesserId);
        if (!targetPlayer || targetPlayer.isFound || !guesserPlayer) return;

        const secret = [...targetPlayer.secretNumber];
        const guessAttempt = [...guess];
        let correct = 0;
        let misplaced = 0;
        
        for (let i = 0; i < settings.digitCount; i++) {
            if (secret[i] === guessAttempt[i]) {
                correct++;
                secret[i] = 'C';
                guessAttempt[i] = 'C';
            }
        }

        for (let i = 0; i < settings.digitCount; i++) {
            if (guessAttempt[i] === 'C') continue;
            const misplacedIndex = secret.findIndex(digit => digit === guessAttempt[i]);
            if (misplacedIndex !== -1) {
                misplaced++;
                secret[misplacedIndex] = 'M';
            }
        }

        const newGuess: Guess = { value: guess.join(''), correct, misplaced, guesserId, guesserName: guesserPlayer.name };
        const playerFound = correct === settings.digitCount;
        
        const updatedPlayers = playersState.map(p => 
            p.id === currentTargetId ? { ...p, history: [...p.history, newGuess], isFound: playerFound || p.isFound } : p
        );

        setPlayers(updatedPlayers);

        const activePlayers = updatedPlayers.filter(p => !p.isFound);
        if (activePlayers.length <= 1) {
            const finalWinner = activePlayers[0] || playersState.find(p => !p.isFound);
            if(finalWinner){
                let availableLosingTitles = [...LOSING_TITLES].sort(() => 0.5 - Math.random());
                const playersWithTitles = updatedPlayers.map(p => {
                    if (p.id === finalWinner.id) {
                        return { ...p, title: WINNING_TITLES[Math.floor(Math.random() * WINNING_TITLES.length)] };
                    }
                    return { ...p, title: availableLosingTitles.pop() || "ผู้ร่วมชะตากรรม" };
                });
                setPlayers(playersWithTitles);
                const winnerWithTitle = playersWithTitles.find(p => p.id === finalWinner.id) || null;
                setWinner(winnerWithTitle);
                soundManager.play(winnerWithTitle?.id === LOCAL_PLAYER_ID ? 'win' : 'lose');
            } else {
                 setPlayers(updatedPlayers);
                 setWinner(null);
                 soundManager.play('lose');
            }
            setGamePhase(GamePhase.GameOver);
            return;
        }

        const nextTurn = calculateNextTurn(updatedPlayers, guesserId, currentTargetId, playerFound);
        if (nextTurn) {
            setCurrentPlayerId(nextTurn.nextGuesserId);
            setTargetPlayerId(nextTurn.nextTargetId);

            if (nextTurn.nextGuesserId !== LOCAL_PLAYER_ID) {
                setTimeout(() => {
                    setPlayers(latestPlayers => {
                        if (latestPlayers.filter(p => !p.isFound).length > 1) {
                            const botGuess = generateNumber(settings.digitCount);
                            setLastBotGuess({ guesserId: nextTurn.nextGuesserId, guess: botGuess });
                            handleSubmitGuess(botGuess, nextTurn.nextGuesserId, nextTurn.nextTargetId, latestPlayers);
                        }
                        return latestPlayers;
                    });
                }, 1500 + Math.random() * 1000);
            }
        }
    }, [settings]);

    const handleTurnTimeout = useCallback(() => {
        if (!settings) return;
        setPlayers(currentPlayers => {
            const nextTurn = calculateNextTurn(currentPlayers, currentPlayerId, targetPlayerId, false);
            if (nextTurn) {
                setCurrentPlayerId(nextTurn.nextGuesserId);
                setTargetPlayerId(nextTurn.nextTargetId);

                if (nextTurn.nextGuesserId !== LOCAL_PLAYER_ID) {
                    setTimeout(() => {
                         setPlayers(latestPlayers => {
                            if (latestPlayers.filter(p => !p.isFound).length > 1) {
                                const botGuess = generateNumber(settings.digitCount);
                                setLastBotGuess({ guesserId: nextTurn.nextGuesserId, guess: botGuess });
                                handleSubmitGuess(botGuess, nextTurn.nextGuesserId, nextTurn.nextTargetId, latestPlayers);
                            }
                            return latestPlayers;
                        });
                    }, 1500 + Math.random() * 1000);
                }
            }
            return currentPlayers;
        });
    }, [settings, currentPlayerId, targetPlayerId, handleSubmitGuess]);

    useEffect(() => {
        if (gamePhase === GamePhase.Playing && settings?.turnTimeLimit && settings.turnTimeLimit > 0 && currentPlayerId === LOCAL_PLAYER_ID) {
            setRemainingTime(settings.turnTimeLimit);
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
    }, [gamePhase, settings, currentPlayerId, handleTurnTimeout]);
    
    const handleCreateLobby = (playerName: string) => {
        setLocalPlayerName(playerName);
        setIsHost(true);
        setGamePhase(GamePhase.Lobby);
    };

    const handleJoinRequest = (playerName: string) => {
        setLocalPlayerName(playerName);
        setGamePhase(GamePhase.Join);
    };

    const handleJoinLobby = (roomCode: string) => {
        // NOTE FOR DEVS: This is where you would call Firebase/backend to join a room.
        // On success, you'd get the lobby data and players, then transition to the Lobby phase.
        console.log(`Attempting to join room with code: ${roomCode}`);
        setIsHost(false);
        setGamePhase(GamePhase.Lobby);
    };
    
    const handleBackToHome = () => {
        setGamePhase(GamePhase.Home);
        setLocalPlayerName('');
        setIsHost(false);
    }

    const handleStartGame = useCallback((playersInLobby: Array<{ name: string; isBot: boolean }>, newSettings: GameSettings) => {
        setSettings(newSettings);
        
        const localPlayerData = playersInLobby.find(p => !p.isBot);
        if (!localPlayerData) {
            handleRestart();
            return;
        }

        const localPlayer: Player = { 
            id: LOCAL_PLAYER_ID, 
            name: localPlayerData.name, 
            secretNumber: [], 
            isFound: false, 
            history: [] 
        };

        const botsToCreate = playersInLobby.filter(p => p.isBot).map(p => ({ name: p.name }));
        setBotConfigs(botsToCreate);
        setPlayers([localPlayer]);
        setGamePhase(GamePhase.Setup);
    }, []);

    const handleSetupComplete = useCallback((secret: string[]) => {
        if (!settings) return;
        const localPlayer = players[0];
        const updatedLocalPlayer = { ...localPlayer, secretNumber: secret };
        
        const botPlayers: Player[] = botConfigs.map((botConfig, i) => ({
            id: i + 1,
            name: botConfig.name,
            secretNumber: generateNumber(settings.digitCount),
            isFound: false,
            history: [],
        }));
        
        const allPlayers = [updatedLocalPlayer, ...botPlayers];
        setPlayers(allPlayers);
        
        setTargetPlayerId(allPlayers.length > 1 ? 1 : 0);
        setCurrentPlayerId(LOCAL_PLAYER_ID);
        setGamePhase(GamePhase.Playing);
    }, [settings, players, botConfigs]);

    const handleRestart = useCallback(() => {
        setGamePhase(GamePhase.Home);
        setSettings(null);
        setPlayers([]);
        setWinner(null);
        setBotConfigs([]);
        setLocalPlayerName('');
        setIsHost(false);
    }, []);

    const renderContent = () => {
        switch (gamePhase) {
            case GamePhase.Home:
                return <HomeScreen onCreateLobby={handleCreateLobby} onJoinRequest={handleJoinRequest} />;
            case GamePhase.Join:
                return <JoinScreen playerName={localPlayerName} onJoinLobby={handleJoinLobby} onBack={handleBackToHome} />;
            case GamePhase.Setup:
                return <SetupScreen settings={settings!} playerName={players[0]?.name || ''} onSetupComplete={handleSetupComplete} />;
            case GamePhase.Playing:
                return <GameScreen 
                            players={players} 
                            settings={settings!}
                            currentPlayerId={currentPlayerId} 
                            targetPlayerId={targetPlayerId}
                            onSubmitGuess={(guess) => handleSubmitGuess(guess, LOCAL_PLAYER_ID, targetPlayerId, players)}
                            localPlayerId={LOCAL_PLAYER_ID}
                            remainingTime={remainingTime}
                            sfxEnabled={sfxEnabled}
                            bgmEnabled={bgmEnabled}
                            onSfxToggle={handleSfxToggle}
                            onBgmToggle={handleBgmToggle}
                            onSendMessage={handleSendMessage}
                            lastBotGuess={lastBotGuess}
                        />;
            case GamePhase.GameOver:
                return <GameOverScreen players={players} winner={winner} onRestart={handleRestart} />;
            case GamePhase.Lobby:
            default:
                return <LobbyScreen
                            isHost={isHost}
                            hostName={localPlayerName}
                            onStartGame={handleStartGame} 
                            sfxEnabled={sfxEnabled}
                            bgmEnabled={bgmEnabled}
                            onSfxToggle={handleSfxToggle}
                            onBgmToggle={handleBgmToggle}
                        />;
        }
    };

    return <div className="bg-slate-900">{renderContent()}</div>;
};

export default App;
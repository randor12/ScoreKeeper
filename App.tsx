import React, { useState, useEffect } from 'react';
import { PlusCircle, RotateCcw, Users, RefreshCw, LayoutGrid, Spade } from 'lucide-react';
import PlayerCard from './components/PlayerCard';
import ScoreChart from './components/ScoreChart';
import SpadesGame from './components/SpadesGame';
import { Player } from './types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // Game Mode State
  const [gameMode, setGameMode] = useState<'standard' | 'spades'>('standard');

  // STANDARD MODE STATE
  // Initialize with the requirement: 1 unnamed person that needs to be entered first.
  const [players, setPlayers] = useState<Player[]>([
    { id: generateId(), name: '', score: 0, tieBreakerOrder: 0, isEditing: true }
  ]);

  const [newPlayerName, setNewPlayerName] = useState('');

  // Persist to LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('scorekeepr_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migration: Ensure tieBreakerOrder exists for legacy data
          const migratedData = parsed.map((p, index) => ({
            ...p,
            tieBreakerOrder: typeof p.tieBreakerOrder === 'number' ? p.tieBreakerOrder : index
          }));
          setPlayers(migratedData);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scorekeepr_data', JSON.stringify(players));
  }, [players]);

  const addPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameToAdd = newPlayerName.trim() || `Player ${players.length + 1}`;
    
    setPlayers(prev => [
      ...prev,
      { 
        id: generateId(), 
        name: nameToAdd, 
        score: 0, 
        tieBreakerOrder: Date.now(), // Use timestamp for unique order
        isEditing: false 
      }
    ]);
    setNewPlayerName('');
  };

  const updateScore = (id: string, delta: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, score: p.score + delta } : p
    ));
  };

  const setPlayerScore = (id: string, newScore: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, score: newScore } : p
    ));
  };

  const updateName = (id: string, newName: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, name: newName, isEditing: false } : p
    ));
  };

  const toggleEdit = (id: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, isEditing: !p.isEditing } : p
    ));
  };

  const deletePlayer = (id: string) => {
    setPlayers(prev => {
      const remaining = prev.filter(p => p.id !== id);
      if (remaining.length === 0) {
        // Enforce "1 unnamed person that needs to be entered first" rule if list becomes empty
        return [{ id: generateId(), name: '', score: 0, tieBreakerOrder: 0, isEditing: true }];
      }
      return remaining;
    });
  };

  const handleHardReset = () => {
    // Direct action without confirm to avoid blocking issues
    const initialPlayer = { id: generateId(), name: '', score: 0, tieBreakerOrder: 0, isEditing: true };
    setPlayers([initialPlayer]);
    localStorage.removeItem('scorekeepr_data');
  };

  const handleScoreReset = () => {
     // Direct action without confirm to avoid blocking issues
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
  };

  // Sort players for display (Highest score first, then tieBreakerOrder ascending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Secondary sort: manual order (ascending)
    return (a.tieBreakerOrder ?? 0) - (b.tieBreakerOrder ?? 0);
  });

  const movePlayer = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedPlayers.findIndex(p => p.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    // Check bounds
    if (targetIndex < 0 || targetIndex >= sortedPlayers.length) return;

    const currentPlayer = sortedPlayers[currentIndex];
    const targetPlayer = sortedPlayers[targetIndex];

    // Only allow moving if scores are tied
    if (currentPlayer.score !== targetPlayer.score) return;

    // Swap tieBreakerOrder
    setPlayers(prev => prev.map(p => {
      if (p.id === currentPlayer.id) return { ...p, tieBreakerOrder: targetPlayer.tieBreakerOrder };
      if (p.id === targetPlayer.id) return { ...p, tieBreakerOrder: currentPlayer.tieBreakerOrder };
      return p;
    }));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            ScoreKeepr
          </h1>
          <p className="text-slate-400 text-sm">Simple, fast score tracking</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setGameMode('standard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              gameMode === 'standard' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={16} /> Standard
          </button>
          <button
            onClick={() => setGameMode('spades')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              gameMode === 'spades' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Spade size={16} /> Spades
          </button>
        </div>
      </header>

      {/* Mode Content */}
      {gameMode === 'spades' ? (
        <SpadesGame />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Main Content: Player List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Add Form */}
            <form onSubmit={addPlayer} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Add another player..."
                className="block w-full pl-10 pr-12 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
              />
              <button 
                type="submit"
                className="absolute inset-y-1 right-1 flex items-center px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                <PlusCircle size={18} />
              </button>
            </form>

            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={handleScoreReset}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 active:bg-slate-600"
              >
                <RefreshCw size={14} />
                Reset Scores
              </button>
              <button 
                type="button"
                onClick={handleHardReset}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/20 active:bg-red-500/30"
              >
                <RotateCcw size={14} />
                Full Reset
              </button>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedPlayers.map((player, index) => {
                const diffToFirst = index > 0 ? sortedPlayers[0].score - player.score : undefined;
                const diffToNext = index > 0 ? sortedPlayers[index - 1].score - player.score : undefined;
                
                const canMoveUp = index > 0 && sortedPlayers[index - 1].score === player.score;
                const canMoveDown = index < sortedPlayers.length - 1 && sortedPlayers[index + 1].score === player.score;

                return (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    rank={index + 1}
                    diffToFirst={diffToFirst}
                    diffToNext={diffToNext}
                    onUpdateScore={updateScore}
                    onSetScore={setPlayerScore}
                    onUpdateName={updateName}
                    onToggleEdit={toggleEdit}
                    onDelete={deletePlayer}
                    onMove={movePlayer}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  />
                );
              })}
            </div>
          </div>

          {/* Sidebar: Stats */}
          <div className="space-y-6">
            <ScoreChart players={players} />
            
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-slate-100 font-semibold mb-2">Game Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Players</span>
                  <span className="text-slate-200">{players.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Points</span>
                  <span className="text-slate-200">
                    {players.reduce((acc, curr) => acc + curr.score, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Score</span>
                  <span className="text-slate-200">
                    {players.length > 0 
                      ? Math.round(players.reduce((acc, curr) => acc + curr.score, 0) / players.length) 
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
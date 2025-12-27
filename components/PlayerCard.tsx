import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Trash2, Edit2, Check, User } from 'lucide-react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onUpdateScore: (id: string, delta: number) => void;
  onSetScore: (id: string, newScore: number) => void;
  onUpdateName: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onToggleEdit: (id: string) => void;
  rank: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onUpdateScore, 
  onSetScore,
  onUpdateName, 
  onDelete, 
  onToggleEdit,
  rank
}) => {
  // Name Editing State
  const [tempName, setTempName] = useState(player.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Score Management State
  const [deltaAmount, setDeltaAmount] = useState('');
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [exactScore, setExactScore] = useState(player.score.toString());
  const scoreInputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useEffect(() => {
    if (player.isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [player.isEditing]);

  useEffect(() => {
    if (isEditingScore && scoreInputRef.current) {
      scoreInputRef.current.focus();
      scoreInputRef.current.select();
    }
  }, [isEditingScore]);

  // Sync exact score state if prop changes (e.g. global reset)
  useEffect(() => {
    setExactScore(player.score.toString());
  }, [player.score]);

  // Name Handlers
  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onUpdateName(player.id, tempName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit();
  };

  // Score Handlers
  const handleDelta = (sign: number) => {
    if (!deltaAmount) return;
    const val = parseInt(deltaAmount);
    if (!isNaN(val)) {
      onUpdateScore(player.id, val * sign);
      setDeltaAmount(''); // Clear input for next entry
    }
  };

  const handleExactScoreSubmit = () => {
    const val = parseInt(exactScore);
    if (!isNaN(val)) {
      onSetScore(player.id, val);
    } else {
      setExactScore(player.score.toString()); // Revert if invalid
    }
    setIsEditingScore(false);
  };

  const handleScoreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleExactScoreSubmit();
    if (e.key === 'Escape') {
      setExactScore(player.score.toString());
      setIsEditingScore(false);
    }
  };

  const getRankColor = (r: number) => {
    if (r === 1) return 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] bg-slate-800/80';
    if (r === 2) return 'border-slate-400/50 bg-slate-800/60';
    if (r === 3) return 'border-orange-700/50 bg-slate-800/60';
    return 'border-slate-700 bg-slate-800';
  };

  return (
    <div className={`relative rounded-xl p-4 border transition-all duration-200 ${getRankColor(rank)} flex flex-col gap-4 overflow-hidden`}>
      {/* Header: Rank, Name, Delete */}
      <div className="flex items-center justify-between gap-3">
        {/* Rank & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`
            shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
            ${rank === 1 ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-300'}
          `}>
            #{rank}
          </div>

          {player.isEditing ? (
            <div className="flex-1 flex gap-2 min-w-0">
              <input
                ref={nameInputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameSubmit}
                placeholder="Enter Name..."
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1 text-slate-100 focus:outline-none focus:border-indigo-500 min-w-0"
              />
              <button onClick={handleNameSubmit} className="p-1 bg-indigo-600 rounded text-white shrink-0">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div 
              className="flex-1 font-semibold text-lg text-slate-100 truncate cursor-pointer flex items-center gap-2 group min-w-0"
              onClick={() => onToggleEdit(player.id)}
            >
              <span className="truncate">{player.name || <span className="text-slate-500 italic flex items-center gap-1"><User size={14}/> Unnamed</span>}</span>
              <Edit2 size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* Delete */}
        <button 
          onClick={() => onDelete(player.id)}
          className="shrink-0 text-slate-600 hover:text-red-400 p-2 rounded-full hover:bg-slate-700/50 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main Score Display (Direct Edit) */}
      <div className="flex justify-center py-2">
        {isEditingScore ? (
          <div className="flex items-center gap-2 w-full max-w-[200px]">
             <input
                ref={scoreInputRef}
                type="number"
                value={exactScore}
                onChange={(e) => setExactScore(e.target.value)}
                onKeyDown={handleScoreKeyDown}
                onBlur={handleExactScoreSubmit}
                className="w-full text-center text-4xl font-mono font-bold bg-slate-900 border-b-2 border-indigo-500 text-white focus:outline-none py-1"
              />
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingScore(true)}
            className="group relative cursor-pointer flex flex-col items-center"
            title="Click to edit score directly"
          >
             <span className="text-5xl font-bold font-mono tracking-tighter text-white group-hover:text-indigo-200 transition-colors">
              {player.score.toLocaleString()}
             </span>
             <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-1 group-hover:text-indigo-400">Total Score</span>
          </div>
        )}
      </div>

      {/* Action Bar: Input and +/- Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleDelta(-1)}
          disabled={!deltaAmount}
          className="shrink-0 w-12 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
        >
          <Minus size={24} />
        </button>

        <input
          type="number"
          value={deltaAmount}
          onChange={(e) => setDeltaAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDelta(1);
          }}
          placeholder="Points..."
          className="flex-1 min-w-0 bg-slate-900/50 border border-slate-700 rounded-lg px-2 text-center text-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />

        <button
          onClick={() => handleDelta(1)}
          disabled={!deltaAmount}
          className="shrink-0 w-12 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default PlayerCard;
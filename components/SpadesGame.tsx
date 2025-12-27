import React, { useState, useEffect } from 'react';
import { Trophy, Save, History, AlertCircle, Trash2, Edit3, X, Users, Settings } from 'lucide-react';
import { SpadesTeam, SpadesRound } from '../types';

interface SpadesGameProps {
  onBack?: () => void;
}

interface TeamNameInputsProps {
  teams: [SpadesTeam, SpadesTeam];
  onUpdateName: (teamIdx: 0 | 1, playerIdx: 0 | 1, name: string) => void;
}

const TeamNameInputs: React.FC<TeamNameInputsProps> = ({ teams, onUpdateName }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="space-y-4">
      <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-sm">Team 1</h4>
      <input 
        value={teams[0].players[0].name}
        onChange={(e) => onUpdateName(0, 0, e.target.value)}
        placeholder="Player 1 Name"
        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
        autoFocus // Helper for initial focus if needed, but not strictly required
      />
      <input 
        value={teams[0].players[1].name}
        onChange={(e) => onUpdateName(0, 1, e.target.value)}
        placeholder="Player 2 Name"
        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
      />
    </div>
    <div className="space-y-4">
      <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-sm">Team 2</h4>
      <input 
        value={teams[1].players[0].name}
        onChange={(e) => onUpdateName(1, 0, e.target.value)}
        placeholder="Player 3 Name"
        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-cyan-500 outline-none"
      />
      <input 
        value={teams[1].players[1].name}
        onChange={(e) => onUpdateName(1, 1, e.target.value)}
        placeholder="Player 4 Name"
        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-cyan-500 outline-none"
      />
    </div>
  </div>
);

const SpadesGame: React.FC<SpadesGameProps> = () => {
  // Game State
  const [teams, setTeams] = useState<[SpadesTeam, SpadesTeam]>([
    { id: 1, players: [{ id: 'p1', name: '' }, { id: 'p2', name: '' }], score: 0, bags: 0 },
    { id: 2, players: [{ id: 'p3', name: '' }, { id: 'p4', name: '' }], score: 0, bags: 0 }
  ]);
  const [history, setHistory] = useState<SpadesRound[]>([]);
  const [isSetup, setIsSetup] = useState(true);

  // Round Input State
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [isNameEditModalOpen, setIsNameEditModalOpen] = useState(false);
  
  const [t1Bids, setT1Bids] = useState<[string, string]>(['0', '0']);
  const [t2Bids, setT2Bids] = useState<[string, string]>(['0', '0']);
  const [t1Tricks, setT1Tricks] = useState<string>('');
  const [t2Tricks, setT2Tricks] = useState<string>('');
  const [t1NilFailed, setT1NilFailed] = useState<[boolean, boolean]>([false, false]);
  const [t2NilFailed, setT2NilFailed] = useState<[boolean, boolean]>([false, false]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('scorekeepr_spades_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.teams && parsed.history) {
          setTeams(parsed.teams);
          setHistory(parsed.history);
          // Determine if we are in setup mode or game mode
          if (parsed.history.length > 0 || parsed.teams.some((t: SpadesTeam) => t.score !== 0)) {
             setIsSetup(false);
          } else {
             // If data exists but seems fresh (score 0, no history), check names
             // If names are empty, it's definitely setup. If names are set, it might be a game that just started.
             // We'll assume if names are set, the user likely passed setup.
             const hasNames = parsed.teams[0].players[0].name !== '' || parsed.teams[1].players[0].name !== '';
             setIsSetup(!hasNames); 
          }
        }
      } catch (e) {
        console.error("Failed to load spades data", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('scorekeepr_spades_data', JSON.stringify({ teams, history }));
  }, [teams, history]);

  const updateTeamName = (teamIdx: 0 | 1, playerIdx: 0 | 1, name: string) => {
    setTeams(prev => {
      const newTeams = [...prev] as [SpadesTeam, SpadesTeam];
      newTeams[teamIdx].players[playerIdx].name = name;
      return newTeams;
    });
  };

  const calculateRound = () => {
    const t1Bid1 = parseInt(t1Bids[0]) || 0;
    const t1Bid2 = parseInt(t1Bids[1]) || 0;
    const t2Bid1 = parseInt(t2Bids[0]) || 0;
    const t2Bid2 = parseInt(t2Bids[1]) || 0;
    
    const team1Tricks = parseInt(t1Tricks) || 0;
    const team2Tricks = parseInt(t2Tricks) || 0;

    // Validate tricks
    if (team1Tricks + team2Tricks !== 13) {
      alert("Total tricks must equal 13");
      return;
    }

    const calculateTeamScore = (
      p1Bid: number, 
      p2Bid: number, 
      tricks: number, 
      nilFailed: [boolean, boolean],
      currentBags: number
    ) => {
      let scoreDelta = 0;
      let bagsDelta = 0;
      
      // Calculate Team Bid (excluding Nils)
      const teamBid = (p1Bid === 0 ? 0 : p1Bid) + (p2Bid === 0 ? 0 : p2Bid);
      
      // 1. Handle Team Bid Outcome
      if (tricks < teamBid) {
        // Failed bid
        scoreDelta -= teamBid * 10;
      } else {
        // Made bid
        scoreDelta += (teamBid * 10) + (tricks - teamBid);
        bagsDelta += (tricks - teamBid);
      }

      // 2. Handle Nil Bonuses/Penalties
      // Player 1 Nil
      if (p1Bid === 0) {
        scoreDelta += nilFailed[0] ? -100 : 100;
      }
      // Player 2 Nil
      if (p2Bid === 0) {
        scoreDelta += nilFailed[1] ? -100 : 100;
      }

      // 3. Handle Bag Penalty (10 bags = -100)
      let newBagsTotal = currentBags + bagsDelta;
      if (newBagsTotal >= 10) {
        scoreDelta -= 100;
        newBagsTotal -= 10;
      }

      return { scoreDelta, bagsDelta, newBagsTotal };
    };

    const t1Result = calculateTeamScore(t1Bid1, t1Bid2, team1Tricks, t1NilFailed, teams[0].bags);
    const t2Result = calculateTeamScore(t2Bid1, t2Bid2, team2Tricks, t2NilFailed, teams[1].bags);

    const round: SpadesRound = {
      id: Math.random().toString(36).substr(2, 9),
      roundNumber: history.length + 1,
      team1: {
        bids: [t1Bid1, t1Bid2],
        tricks: team1Tricks,
        scoreDelta: t1Result.scoreDelta,
        nilFailed: t1NilFailed,
        bagsDelta: t1Result.bagsDelta
      },
      team2: {
        bids: [t2Bid1, t2Bid2],
        tricks: team2Tricks,
        scoreDelta: t2Result.scoreDelta,
        nilFailed: t2NilFailed,
        bagsDelta: t2Result.bagsDelta
      }
    };

    setHistory(prev => [round, ...prev]);
    setTeams(prev => [
      { ...prev[0], score: prev[0].score + t1Result.scoreDelta, bags: t1Result.newBagsTotal },
      { ...prev[1], score: prev[1].score + t2Result.scoreDelta, bags: t2Result.newBagsTotal }
    ]);

    // Reset Form
    setIsRoundModalOpen(false);
    setT1Bids(['0', '0']);
    setT2Bids(['0', '0']);
    setT1Tricks('');
    setT2Tricks('');
    setT1NilFailed([false, false]);
    setT2NilFailed([false, false]);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to fully reset Spades Mode? This will clear all scores, history, and team names.")) {
      // Reset to default initial state with empty names
      setTeams([
        { id: 1, players: [{ id: 'p1', name: '' }, { id: 'p2', name: '' }], score: 0, bags: 0 },
        { id: 2, players: [{ id: 'p3', name: '' }, { id: 'p4', name: '' }], score: 0, bags: 0 }
      ]);
      setHistory([]);
      setIsSetup(true);
      // Explicitly clear storage to ensure no ghost data persists if component unmounts quickly
      localStorage.removeItem('scorekeepr_spades_data');
    }
  };

  const deleteRound = (roundId: string) => {
    const roundToDelete = history.find(r => r.id === roundId);
    if (!roundToDelete) return;

    setTeams(prev => [
      { 
        ...prev[0], 
        score: prev[0].score - roundToDelete.team1.scoreDelta, 
        bags: Math.max(0, prev[0].bags - roundToDelete.team1.bagsDelta) // Imperfect but safe
      },
      { 
        ...prev[1], 
        score: prev[1].score - roundToDelete.team2.scoreDelta, 
        bags: Math.max(0, prev[1].bags - roundToDelete.team2.bagsDelta)
      }
    ]);
    
    setHistory(prev => prev.filter(r => r.id !== roundId));
  };

  const renderBidInput = (
    label: string, 
    value: string, 
    onChange: (val: string) => void,
    isNilFailed: boolean,
    onNilFailToggle: () => void
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 font-medium uppercase">{label}</label>
      <div className="flex items-center gap-2">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-2 text-white w-full focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="0">Nil (0)</option>
          {[...Array(13)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </div>
      {value === '0' && (
        <label className="flex items-center gap-2 mt-1 cursor-pointer bg-red-900/20 p-1.5 rounded border border-red-900/30">
          <input 
            type="checkbox" 
            checked={isNilFailed} 
            onChange={onNilFailToggle}
            className="rounded border-slate-600 text-red-500 focus:ring-red-500 bg-slate-900"
          />
          <span className="text-xs text-red-300 font-medium">Failed?</span>
        </label>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
            <Trophy size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Spades Mode</h2>
            <p className="text-xs text-slate-400">First to 500 wins • 10 Bags = -100</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
           {/* Edit Names Button (Visible in Game Mode) */}
           {!isSetup && (
            <button 
              onClick={() => setIsNameEditModalOpen(true)}
              className="text-slate-400 hover:text-indigo-400 transition-colors p-2 rounded hover:bg-slate-700/50"
              title="Edit Team Names"
            >
              <Settings size={20} />
            </button>
          )}

          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded hover:bg-slate-700/50"
            title="Full Reset (Re-enter Teams)"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Setup View */}
      {isSetup && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={18} /> Team Setup
          </h3>
          <TeamNameInputs teams={teams} onUpdateName={updateTeamName} />
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => setIsSetup(false)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Name Edit Modal (Overlay) */}
      {isNameEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-2xl shadow-2xl relative">
             <button 
               onClick={() => setIsNameEditModalOpen(false)} 
               className="absolute top-4 right-4 text-slate-400 hover:text-white"
             >
               <X size={24} />
             </button>
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Edit3 size={20} /> Edit Team Names
             </h3>
             <TeamNameInputs teams={teams} onUpdateName={updateTeamName} />
             <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setIsNameEditModalOpen(false)}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Done
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Game View */}
      {!isSetup && (
        <>
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4">
            {teams.map((team, idx) => (
              <div 
                key={team.id} 
                className={`
                  relative p-6 rounded-2xl border flex flex-col items-center justify-center text-center gap-2
                  ${idx === 0 
                    ? 'bg-slate-800/80 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-800/80 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]'}
                `}
              >
                <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                   {/* Name display - Allow quick edit via header button, but here just display */}
                   <span className="truncate max-w-[120px] sm:max-w-none">{team.players[0].name || 'P1'}</span> 
                   <span className="opacity-50">&</span> 
                   <span className="truncate max-w-[120px] sm:max-w-none">{team.players[1].name || 'P2'}</span>
                </div>
                <div className={`text-6xl font-bold font-mono tracking-tighter ${idx === 0 ? 'text-indigo-100' : 'text-cyan-100'}`}>
                  {team.score}
                </div>
                <div className="flex items-center gap-1.5 mt-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                  <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Bags</span>
                  <span className={`font-mono font-bold ${team.bags >= 8 ? 'text-red-400' : 'text-slate-300'}`}>
                    {team.bags}
                  </span>
                  <span className="text-slate-600 text-xs">/ 10</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          {!isRoundModalOpen && (
            <button 
              onClick={() => setIsRoundModalOpen(true)}
              className="w-full py-4 bg-slate-100 text-slate-900 hover:bg-white rounded-xl font-bold text-lg shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Edit3 size={20} /> Record Round
            </button>
          )}

          {/* Round Entry Modal/Card */}
          {isRoundModalOpen && (
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Round {history.length + 1}</h3>
                <button onClick={() => setIsRoundModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team 1 Inputs */}
                <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="font-bold text-indigo-400 border-b border-indigo-500/20 pb-2 mb-2 truncate">
                    {teams[0].players[0].name || 'P1'} & {teams[0].players[1].name || 'P2'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {renderBidInput(
                      (teams[0].players[0].name || 'P1').split(' ')[0] + " Bid",
                      t1Bids[0],
                      (v) => setT1Bids([v, t1Bids[1]]),
                      t1NilFailed[0],
                      () => setT1NilFailed([!t1NilFailed[0], t1NilFailed[1]])
                    )}
                    {renderBidInput(
                      (teams[0].players[1].name || 'P2').split(' ')[0] + " Bid",
                      t1Bids[1],
                      (v) => setT1Bids([t1Bids[0], v]),
                      t1NilFailed[1],
                      () => setT1NilFailed([t1NilFailed[0], !t1NilFailed[1]])
                    )}
                  </div>
                  <div className="pt-2">
                     <label className="text-xs text-slate-400 font-medium uppercase block mb-1">Team Tricks Taken</label>
                     <input 
                      type="number" 
                      value={t1Tricks}
                      onChange={(e) => setT1Tricks(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center font-mono text-lg focus:border-indigo-500 outline-none"
                      placeholder="?"
                     />
                  </div>
                  <div className="text-center text-xs text-slate-500">
                    Team Bid: <span className="text-slate-300 font-bold">{(parseInt(t1Bids[0]) || 0) + (parseInt(t1Bids[1]) || 0)}</span>
                  </div>
                </div>

                {/* Team 2 Inputs */}
                <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="font-bold text-cyan-400 border-b border-cyan-500/20 pb-2 mb-2 truncate">
                    {teams[1].players[0].name || 'P3'} & {teams[1].players[1].name || 'P4'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {renderBidInput(
                      (teams[1].players[0].name || 'P3').split(' ')[0] + " Bid",
                      t2Bids[0],
                      (v) => setT2Bids([v, t2Bids[1]]),
                      t2NilFailed[0],
                      () => setT2NilFailed([!t2NilFailed[0], t2NilFailed[1]])
                    )}
                    {renderBidInput(
                      (teams[1].players[1].name || 'P4').split(' ')[0] + " Bid",
                      t2Bids[1],
                      (v) => setT2Bids([t2Bids[0], v]),
                      t2NilFailed[1],
                      () => setT2NilFailed([t2NilFailed[0], !t2NilFailed[1]])
                    )}
                  </div>
                  <div className="pt-2">
                     <label className="text-xs text-slate-400 font-medium uppercase block mb-1">Team Tricks Taken</label>
                     <input 
                      type="number" 
                      value={t2Tricks}
                      onChange={(e) => setT2Tricks(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center font-mono text-lg focus:border-cyan-500 outline-none"
                      placeholder="?"
                     />
                  </div>
                  <div className="text-center text-xs text-slate-500">
                    Team Bid: <span className="text-slate-300 font-bold">{(parseInt(t2Bids[0]) || 0) + (parseInt(t2Bids[1]) || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Validation Message */}
              {(parseInt(t1Tricks) || 0) + (parseInt(t2Tricks) || 0) !== 13 && (t1Tricks !== '' || t2Tricks !== '') && (
                <div className="mt-4 flex items-center justify-center gap-2 text-amber-400 text-sm font-medium bg-amber-900/20 py-2 rounded">
                  <AlertCircle size={16} /> Total tricks must be 13 (Current: {(parseInt(t1Tricks) || 0) + (parseInt(t2Tricks) || 0)})
                </div>
              )}

              <button 
                onClick={calculateRound}
                disabled={(parseInt(t1Tricks) || 0) + (parseInt(t2Tricks) || 0) !== 13}
                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold shadow-lg transition-colors"
              >
                Submit Round
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <History size={16} /> Round History
              </h3>
              <div className="space-y-2">
                {history.map((round) => (
                  <div key={round.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                      <span className="text-slate-400 font-mono text-xs">Round {round.roundNumber}</span>
                      <button onClick={() => deleteRound(round.id)} className="text-slate-600 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col gap-1">
                         <div className="flex justify-between text-slate-400 text-xs">
                           <span>Bid: {round.team1.bids.map(b => b === 0 ? 'N' : b).join('+')}</span>
                           <span>Tricks: {round.team1.tricks}</span>
                         </div>
                         <div className={`font-bold ${round.team1.scoreDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {round.team1.scoreDelta > 0 ? '+' : ''}{round.team1.scoreDelta} pts
                         </div>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                         <div className="flex justify-between text-slate-400 text-xs">
                           <span>Bid: {round.team2.bids.map(b => b === 0 ? 'N' : b).join('+')}</span>
                           <span>Tricks: {round.team2.tricks}</span>
                         </div>
                         <div className={`font-bold ${round.team2.scoreDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {round.team2.scoreDelta > 0 ? '+' : ''}{round.team2.scoreDelta} pts
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpadesGame;
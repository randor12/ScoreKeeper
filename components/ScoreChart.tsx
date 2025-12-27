import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Player } from '../types';

interface ScoreChartProps {
  players: Player[];
}

const ScoreChart: React.FC<ScoreChartProps> = ({ players }) => {
  if (players.length === 0) return null;

  // Filter out unnamed or empty players for the chart to keep it clean
  // Sort by score descending
  const data = [...players]
    .filter(p => p.name.trim() !== '')
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      name: p.name,
      score: p.score,
      // Color logic: Top player gets Gold/Yellow, others get Indigo
      color: index === 0 && p.score > 0 ? '#eab308' : '#6366f1'
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
        <p>Add named players to see stats</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Live Leaders</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={80} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;

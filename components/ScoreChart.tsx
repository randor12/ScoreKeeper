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

  // Dynamic height calculation:
  // - 60px per player ensures bars are thick enough and labels are readable
  // - Min height of 250px ensures it looks good with few players
  const rowHeight = 60;
  const chartHeight = Math.max(data.length * rowHeight, 250);

  return (
    <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider shrink-0">Live Leaders</h3>
      
      {/* Scrollable Container with max height */}
      <div className="overflow-y-auto max-h-[400px] pr-2">
        <div style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval={0} // Ensure every name is shown
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  color: '#f1f5f9',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ScoreChart;
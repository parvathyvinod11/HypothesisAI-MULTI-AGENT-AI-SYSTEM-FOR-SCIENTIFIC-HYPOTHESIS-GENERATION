import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { AlertCircle } from "lucide-react";

interface ScoreRadarProps {
  novelty?: number | null;
  testability?: number | null;
  plausibility?: number | null;
  falsifiability?: number | null;
  overall?: number | null;
  isUnavailable?: boolean;
}

export const ScoreRadar: React.FC<ScoreRadarProps> = ({
  novelty,
  testability,
  plausibility,
  falsifiability,
  overall,
  isUnavailable = false,
}) => {
  const isAvailable =
    !isUnavailable &&
    typeof overall === "number" &&
    typeof novelty === "number" &&
    typeof testability === "number" &&
    typeof plausibility === "number" &&
    typeof falsifiability === "number";

  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 h-full min-h-[220px]">
        <div className="w-full flex items-center justify-between mb-1 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Critic Evaluation</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            Unavailable
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-4 text-center space-y-1.5 my-auto">
          <AlertCircle className="w-6 h-6 text-amber-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Critic Evaluation Unavailable</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[220px] leading-snug">
            Structured peer-review metrics could not be computed. Manual peer review is required.
          </p>
        </div>

        {/* Explicitly show all four scores as unavailable / None */}
        <div className="w-full grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Novelty:</span>
            <strong className="text-slate-400 dark:text-slate-500 font-semibold">None</strong>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Testability:</span>
            <strong className="text-slate-400 dark:text-slate-500 font-semibold">None</strong>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Plausibility:</span>
            <strong className="text-slate-400 dark:text-slate-500 font-semibold">None</strong>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Falsifiability:</span>
            <strong className="text-slate-400 dark:text-slate-500 font-semibold">None</strong>
          </div>
        </div>
      </div>
    );
  }

  const data = [
    { subject: "Novelty", score: novelty, fullMark: 100 },
    { subject: "Testability", score: testability, fullMark: 100 },
    { subject: "Plausibility", score: plausibility, fullMark: 100 },
    { subject: "Falsifiability", score: falsifiability, fullMark: 100 },
  ];

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60";
    if (score >= 65) return "text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60";
    return "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60";
  };

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="w-full flex items-center justify-between mb-1 px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Critic Evaluation
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBadge(overall)}`}>
          {overall.toFixed(1)} / 100
        </span>
      </div>

      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke="#cbd5e1" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Rigor"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric breakdown */}
      <div className="w-full grid grid-cols-2 gap-2 mt-1 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span className="font-medium text-[11px]">Novelty:</span>
          <strong className="text-slate-900 dark:text-slate-100 font-bold">{novelty.toFixed(1)}%</strong>
        </div>
        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span className="font-medium text-[11px]">Testability:</span>
          <strong className="text-slate-900 dark:text-slate-100 font-bold">{testability.toFixed(1)}%</strong>
        </div>
        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span className="font-medium text-[11px]">Plausibility:</span>
          <strong className="text-slate-900 dark:text-slate-100 font-bold">{plausibility.toFixed(1)}%</strong>
        </div>
        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span className="font-medium text-[11px]">Falsifiability:</span>
          <strong className="text-slate-900 dark:text-slate-100 font-bold">{falsifiability.toFixed(1)}%</strong>
        </div>
      </div>
    </div>
  );
};

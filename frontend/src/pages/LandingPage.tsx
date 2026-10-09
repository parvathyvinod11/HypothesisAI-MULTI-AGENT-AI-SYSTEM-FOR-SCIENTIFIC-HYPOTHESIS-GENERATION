import React from "react";
import { Atom, ArrowRight, LogIn } from "lucide-react";
import type { User } from "../services/api";

interface LandingPageProps {
  onStartResearch: () => void;
  onGoDashboard: () => void;
  onOpenAuth: () => void;
  user: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartResearch,
  onGoDashboard,
  onOpenAuth,
  user,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Institutional Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={onGoDashboard}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
              <Atom className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Hypothesis<span className="text-blue-700 font-bold">AI</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6 text-sm">
            <button
              onClick={onGoDashboard}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={onStartResearch}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              New Research
            </button>

            {user ? (
              <button
                onClick={onGoDashboard}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium transition-colors text-xs"
              >
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <span>{user.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium transition-colors text-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-600" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Hero: Vertically Centered with Clean Whitespace */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-950 leading-tight">
            AI Scientific Hypothesis Generator
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
            Discover connections across scientific research papers and generate potential testable hypotheses.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartResearch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors"
            >
              Start New Research
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Institutional Minimal Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <span>HypothesisAI &bull; Academic Research Tool</span>
          <span className="text-slate-400">Multi-Agent Literature Discovery System</span>
        </div>
      </footer>
    </div>
  );
};

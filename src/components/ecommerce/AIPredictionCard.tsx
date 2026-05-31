"use client";
import React, { useEffect, useState } from "react";
import { FaBrain, FaChartLine, FaLightbulb, FaRobot } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";

interface PredictionData {
  trend: "Up" | "Down" | "Stable";
  message: string;
  reason: string;
  tip: string;
}

export default function AIPredictionCard() {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        
        const res = await fetch("/api/ai/predict", {
          headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
          credentials: 'include',
        });
        
        const json = await res.json();
        if (json.success) {
          setPrediction(json.data);
        } else {
          setError(json.details || json.error || "Failed to fetch prediction");
        }
      } catch (err) {
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const isApiKeyError = error.includes("leaked") || error.includes("API Key") || error.includes("invalid");
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <FaRobot size={24} />
          <h3 className="font-bold">{isApiKeyError ? "Action Required: Update API Key" : "AI Prediction Error"}</h3>
        </div>
        <p className="mt-2 text-sm text-red-500 dark:text-red-400/80">
          {isApiKeyError 
            ? "Your Gemini API Key is invalid or has been disabled. Please generate a NEW key at aistudio.google.com and update your .env.local file." 
            : error}
        </p>
        {isApiKeyError ? (
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 inline-block text-xs font-bold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Get New API Key
          </a>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-xs font-semibold underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const getTrendColor = () => {
    switch (prediction.trend) {
      case "Up": return "text-green-500 bg-green-50 dark:bg-green-500/10";
      case "Down": return "text-red-500 bg-red-50 dark:bg-red-500/10";
      default: return "text-blue-500 bg-blue-50 dark:bg-blue-500/10";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-brand-500/10 via-white to-brand-600/5 p-6 dark:from-brand-500/20 dark:via-gray-900 dark:to-brand-600/10 md:p-8 shadow-sm">
      <div className="absolute -right-10 -top-10 text-brand-500/10 dark:text-brand-400/5">
        <FaRobot size={150} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
              <HiSparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                AI Business Insight
                <span className="text-[10px] uppercase tracking-wider bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full">Gemini 1.5 Flash</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Next Month Prediction</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${getTrendColor()}`}>
            <FaChartLine />
            Trend: {prediction.trend}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-4">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700/30 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FaBrain className="text-brand-500" /> Analysis
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                "{prediction.message}"
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {prediction.reason}
              </p>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="h-full p-4 rounded-xl bg-brand-500 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500">
                <FaLightbulb size={80} />
              </div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FaLightbulb /> AI Tip
              </h4>
              <p className="text-sm text-brand-50 leading-relaxed relative z-10">
                {prediction.tip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Calendar, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  riskScore: number;
  riskLevel: string;
  lastScreening: string;
}

export default function StatsCards({ riskScore, riskLevel, lastScreening }: StatsCardsProps) {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'from-emerald-500 to-green-600';
      case 'moderate':
        return 'from-amber-500 to-orange-600';
      case 'high':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-slate-500 to-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'from-emerald-900/30 to-green-900/30';
      case 'moderate':
        return 'from-amber-900/30 to-orange-900/30';
      case 'high':
        return 'from-red-900/30 to-rose-900/30';
      default:
        return 'from-slate-900/30 to-gray-900/30';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Risk Score Card */}
      <Card className={`bg-gradient-to-br ${getRiskBgColor(riskLevel)} border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Diabetes Risk Score</CardTitle>
          <div className={`p-2 bg-gradient-to-br ${getRiskColor(riskLevel)} rounded-lg text-white`}>
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center space-x-2">
            <div className="text-3xl font-bold text-white">{riskScore}</div>
            <div className="text-sm text-gray-400">/100</div>
          </div>
          <p className={`text-sm font-medium mt-1 ${
            riskLevel.toLowerCase() === 'low' ? 'text-emerald-400' :
            riskLevel.toLowerCase() === 'moderate' ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {riskLevel} Risk
          </p>
        </CardContent>
      </Card>

      {/* Risk Level Card */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Current Status</CardTitle>
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
            <Activity className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-white">{riskLevel}</div>
          <p className="text-sm text-blue-400 font-medium mt-1">
            Risk Level
          </p>
        </CardContent>
      </Card>

      {/* Last Screening Card */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Last Screening</CardTitle>
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white">
            <Calendar className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold text-white">{lastScreening}</div>
          <p className="text-sm text-purple-400 font-medium mt-1">
            Date Completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

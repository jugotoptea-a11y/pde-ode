'use client';

import React from 'react';
import { SimulationState } from '@/lib/types';
import { SERVER_MAX_BUFFER } from '@/lib/simulation-engine';
import { Activity, AlertOctagon, CheckCircle2, Clock, Cpu, HardDrive, ShieldAlert } from 'lucide-react';

interface PerformanceMetricsProps {
  state: SimulationState;
}

export function PerformanceMetrics({ state }: PerformanceMetricsProps) {
  const isBottleneck = state.server.isBottleneck;
  const isOptimized = state.mode === 'optimized';

  // Calculate packet loss percentage
  const totalFlow = state.server.totalProcessed + state.server.totalDropped;
  const lossPercentage = totalFlow > 0 ? (state.server.totalDropped / totalFlow) * 100 : 0;

  // Stability condition: w*d < (1 - w*u)*epsilon
  const avgW = state.gateways.reduce((a, g) => a + g.w, 0) / state.gateways.length;
  const avgU = state.gateways.reduce((a, g) => a + g.u, 0) / state.gateways.length;
  const dInflow = state.server.inflow;
  const eps = state.server.epsilon;
  const lhs = avgW * dInflow;
  const rhs = (1 - avgW * avgU) * eps;
  const isConditionMet = lhs < rhs;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Status KPI */}
      <div className={`p-3 rounded-xl border flex flex-col justify-between ${
        isBottleneck
          ? 'bg-rose-950/40 border-rose-600/80 text-rose-200'
          : isOptimized
          ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-200'
          : 'bg-slate-900/80 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Estado del Sistema</span>
          {isBottleneck ? (
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="mt-2 font-bold text-sm tracking-tight">
          {isBottleneck ? (
            <span className="text-rose-400 animate-pulse">CUELLO DE BOTELLA</span>
          ) : isOptimized ? (
            <span className="text-emerald-400">ESTABLE (ISS)</span>
          ) : (
            <span className="text-amber-400">ZONA PRE-SATURADA</span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {isBottleneck ? 'Desborde de búfer en curso' : 'Tráfico regularizado'}
        </div>
      </div>

      {/* 2. Packet Drop Rate */}
      <div className={`p-3 rounded-xl border flex flex-col justify-between ${
        lossPercentage > 5
          ? 'bg-rose-950/30 border-rose-700/60'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Pérdida de Paquetes</span>
          <ShieldAlert className={`w-4 h-4 ${lossPercentage > 5 ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-slate-100">
          <span className={lossPercentage > 5 ? 'text-rose-400' : 'text-emerald-400'}>
            {lossPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          {Math.floor(state.server.totalDropped)} paq descartados
        </div>
      </div>

      {/* 3. Server Buffer z(t) */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Búfer Servidor z(t)</span>
          <HardDrive className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-sky-400">
          {state.server.buffer.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ {SERVER_MAX_BUFFER}</span>
        </div>
        <div className="text-[10px] text-slate-400">
          {state.server.isEquilibriumFinite
            ? `Equilibrio z* = ${state.server.zEquilibrium.toFixed(1)}`
            : 'z* → ∞ (Inestable)'}
        </div>
      </div>

      {/* 4. Processing Rate r(z) */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Salida r(z)</span>
          <Activity className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-purple-400">
          {state.server.processingRate.toFixed(1)} <span className="text-xs text-slate-400 font-normal">paq/s</span>
        </div>
        <div className="text-[10px] text-slate-400">
          Límite ε = {state.server.epsilon} paq/s
        </div>
      </div>

      {/* 5. CPU Utilization */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Carga de Proceso</span>
          <Cpu className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-indigo-300">
          {state.server.cpuUtilization}%
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              state.server.cpuUtilization > 90
                ? 'bg-rose-500'
                : state.server.cpuUtilization > 70
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, state.server.cpuUtilization)}%` }}
          />
        </div>
      </div>

      {/* 6. Latency & Delay */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Latencia en Cola</span>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-slate-100">
          {state.server.queueDelay} <span className="text-xs text-slate-400 font-normal">ms</span>
        </div>
        <div className="text-[10px] font-mono">
          {isConditionMet ? (
            <span className="text-emerald-400">wd &lt; (1-wu)ε ✓</span>
          ) : (
            <span className="text-rose-400">wd ≥ (1-wu)ε ✗</span>
          )}
        </div>
      </div>
    </div>
  );
}

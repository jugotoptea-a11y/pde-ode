'use client';

import React from 'react';
import { SimulationState } from '@/lib/types';
import { SERVER_MAX_BUFFER } from '@/lib/simulation-engine';
import { Activity, AlertOctagon, CheckCircle2, Clock, Cpu, HardDrive, ShieldAlert } from 'lucide-react';
import { MathBlock } from './MathBlock';

// Propiedades del componente de indicadores clave de desempeño (KPIs) en tiempo real
interface PerformanceMetricsProps {
  state: SimulationState;
}

/**
 * Componente que muestra las 6 métricas operativas principales del Servidor Central
 * y verifica en tiempo real la condición analítica de existencia de equilibrio finito:
 *   w * d < (1 - w * u) * \varepsilon
 */
export function PerformanceMetrics({ state }: PerformanceMetricsProps) {
  const isBottleneck = state.server.isBottleneck;
  const isOptimized = state.mode === 'optimized';

  // Cálculo del porcentaje acumulado de pérdida de paquetes por desborde (buffer overflow)
  const totalFlow = state.server.totalProcessed + state.server.totalDropped;
  const lossPercentage = totalFlow > 0 ? (state.server.totalDropped / totalFlow) * 100 : 0;

  // Verificación exacta de la condición analítica de estabilidad bajo reducción escalar:
  //   w * d < (1 - w * u) * \varepsilon
  // donde d = \sum_{k=1}^N d_k es la demanda externa agregada y u = \sum_{k=1}^N u_{ki} es la fracción de enrutamiento
  const w = state.server.w;
  const u = state.server.u;
  const totalDemandD = state.gateways.reduce((acc, g) => acc + g.demand, 0);
  const eps = state.server.epsilon;
  const lhs = w * totalDemandD;
  const rhs = (1 - w * u) * eps;
  const isConditionMet = lhs < rhs;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Indicador de Estado del Servidor (Flujo Libre vs Pre-Saturación vs Cuello de Botella) */}
      <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
        isBottleneck
          ? 'bg-rose-950/50 border-rose-600/80 text-rose-200'
          : isOptimized
          ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-200'
          : 'bg-slate-900/80 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Estado del Servidor</span>
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
          ) : isConditionMet ? (
            <span className="text-sky-400">FLUJO LIBRE (FIFO)</span>
          ) : (
            <span className="text-amber-400">PRE-SATURACIÓN</span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {isBottleneck
            ? 'Desborde de cola en curso'
            : isOptimized
            ? 'Consolidación IoT activa'
            : isConditionMet
            ? 'Demanda bajo umbral crítico'
            : 'Riesgo inminente de colapso'}
        </div>
      </div>

      {/* 2. Tasa Acumulada de Pérdida de Datos por Desborde */}
      <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
        lossPercentage > 5
          ? 'bg-rose-950/40 border-rose-700/70'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Pérdida de Datos</span>
          <ShieldAlert className={`w-4 h-4 ${lossPercentage > 5 ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-slate-100 tabular-nums">
          <span className={lossPercentage > 5 ? 'text-rose-400' : 'text-emerald-400'}>
            {lossPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
          {Math.floor(state.server.totalDropped)} paq ({state.server.totalDroppedKB.toFixed(1)} kB)
        </div>
      </div>

      {/* 3. Ocupación Instantánea del Búfer del Servidor z(t) */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">Búfer Servidor <MathBlock math="z(t)" /></span>
          <HardDrive className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-sky-400 tabular-nums">
          {state.server.buffer.toFixed(1)} <span className="text-xs text-slate-400 font-normal">paq</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
          {state.server.bufferKB.toFixed(1)} kB / {(SERVER_MAX_BUFFER * 0.119).toFixed(1)} kB
        </div>
      </div>

      {/* 4. Tasa No Lineal de Procesamiento r(z) */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">Salida Servidor <MathBlock math="r(z)" /></span>
          <Activity className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-purple-400 tabular-nums">
          {state.server.processingRate.toFixed(1)} <span className="text-xs text-slate-400 font-normal">paq/s</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
          {state.server.processingRateKBS.toFixed(2)} kB/s (máx {state.server.epsilonKBS.toFixed(1)} kB/s)
        </div>
      </div>

      {/* 5. Utilización de Capacidad Computacional (CPU) r(z) / \varepsilon */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Carga de Servidor</span>
          <Cpu className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-indigo-300 tabular-nums">
          {state.server.cpuUtilization.toFixed(0)}%
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
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

      {/* 6. Latencia de Cola y Condición Analítica de Estabilidad wd < (1 - wu)\varepsilon */}
      <div className="p-3 rounded-xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Latencia de Cola</span>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2 font-mono font-bold text-lg text-slate-100 tabular-nums">
          {state.server.queueDelay} <span className="text-xs text-slate-400 font-normal">ms</span>
        </div>
        <div className="text-[10px] font-mono tabular-nums">
          {isConditionMet ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <MathBlock math="wd < (1-wu)\varepsilon" /> ✓
            </span>
          ) : (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <MathBlock math="wd \ge (1-wu)\varepsilon" /> ✗
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

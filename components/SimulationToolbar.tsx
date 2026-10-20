'use client';

import React from 'react';
import { SimulationMode } from '@/lib/types';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Server, Network } from 'lucide-react';

// Propiedades de la barra de herramientas global de la simulación
interface SimulationToolbarProps {
  mode: SimulationMode;
  onToggleMode: (mode: SimulationMode) => void;
  numGateways: number;
  onChangeNumGateways: (n: number) => void;
  serverEpsilon: number;
  onChangeServerEpsilon: (eps: number) => void;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
}

/**
 * Barra de control principal para alternar entre el Modo No Optimizado (FIFO) y el
 * Modo Optimizado (Control ISS Cero DesBorde), configurar la topología de N Gateways
 * y ajustar la capacidad asintótica de procesamiento del servidor (\varepsilon).
 */
export function SimulationToolbar({
  mode,
  onToggleMode,
  numGateways,
  onChangeNumGateways,
  serverEpsilon,
  onChangeServerEpsilon,
  isRunning,
  onTogglePlayPause,
  onReset,
  simSpeed,
  onChangeSimSpeed,
}: SimulationToolbarProps) {
  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Fila Superior: Selector de Modalidad de Control (Optimizado ISS vs No Optimizado FIFO) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Modalidad de Simulación:
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1 max-w-xl">
          {/* Botón Modo No Optimizado */}
          <button
            onClick={() => onToggleMode('unoptimized')}
            className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${mode === 'unoptimized'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-lg shadow-rose-950/50 ring-1 ring-rose-400/30'
              : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            <AlertTriangle className={`w-4 h-4 ${mode === 'unoptimized' ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="leading-tight">Modo No Optimizado</div>
              <div className="text-[10px] font-normal text-rose-300/80">Convencional (w=1, cuello de botella)</div>
            </div>
          </button>

          {/* Botón Modo Optimizado */}
          <button
            onClick={() => onToggleMode('optimized')}
            className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${mode === 'optimized'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30'
              : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            <ShieldCheck className={`w-4 h-4 ${mode === 'optimized' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="leading-tight">Modo Optimizado (Cero DesBorde)</div>
              <div className="text-[10px] font-normal text-emerald-300/80">Control ISS adaptativo (PDE-ODE)</div>
            </div>
          </button>
        </div>

        {/* Controles de Ejecución (Pausar / Reanudar / Reiniciar / Velocidad) */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            onClick={onTogglePlayPause}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition-all ${isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Iniciar
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title="Reiniciar simulación"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Selector de multiplicador de velocidad temporal */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px] font-mono">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSimSpeed(spd)}
                className={`px-2 py-1 rounded transition-colors ${simSpeed === spd ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fila Inferior: Configuración de Topología (N Gateways) y Capacidad del Servidor (\varepsilon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector de Cantidad de Gateways / Líneas de Transmisión PDE */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-sky-400" />
              <span>Topología: Cantidad de Gateways / Nodos</span>
            </span>
            <span className="font-mono text-sky-300 font-bold text-xs">
              {numGateways} {numGateways === 1 ? 'Nodo (Línea Única)' : 'Nodos Distribuidos'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => onChangeNumGateways(n)}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all border ${numGateways === n
                  ? 'bg-sky-600 border-sky-400 text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
              >
                {n === 1 ? '1 Gateway' : `${n} Gateways`}
              </button>
            ))}
          </div>
        </div>

        {/* Control Deslizante de Capacidad Asintótica de Procesamiento del Servidor (\varepsilon) */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Capacidad Máx de Procesamiento del Servidor (ε)</span>
            </span>
            <span className="font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60 tabular-nums">
              ε = {serverEpsilon} paq/s ({((serverEpsilon * 119) / 1000).toFixed(2)} kB/s)
            </span>
          </div>

          <input
            type="range"
            min="15"
            max="180"
            step="5"
            value={serverEpsilon}
            onChange={(e) => onChangeServerEpsilon(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>15 paq/s (~1.8 kB/s)</span>
            <span>Tasa Asintótica: r(z) → ε</span>
            <span>180 paq/s (~21.4 kB/s)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

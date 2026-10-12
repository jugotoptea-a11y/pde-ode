'use client';

import React from 'react';
import { EnvironmentalState, GatewayNodeState, WeatherPreset } from '@/lib/types';
import { CloudRain, Waves, Thermometer, Zap, Layers, Cpu, ShieldCheck } from 'lucide-react';

interface EnvironmentalControlsProps {
  gateways: GatewayNodeState[];
  selectedGatewayIndex: number;
  onSelectGateway: (index: number) => void;
  onUpdateGatewayEnvironment: (index: number, newEnv: EnvironmentalState) => void;
  onApplyPreset: (preset: WeatherPreset) => void;
  onTriggerSpike: (index: number) => void;
}

export function EnvironmentalControls({
  gateways,
  selectedGatewayIndex,
  onSelectGateway,
  onUpdateGatewayEnvironment,
  onApplyPreset,
  onTriggerSpike,
}: EnvironmentalControlsProps) {
  return (
    <div className="bg-slate-900/95 rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Top Header & Global Meteorological Presets */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CloudRain className="w-4 h-4" />
            </span>
            <span>Control Ambiental Individual por Nodo Gateway</span>
            <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
              Paquete Unificado JSON ~119 Bytes | Ahorro ~25%
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cada sensor mide localmente (~20 B). El gateway unifica ambas lecturas con timestamp en un solo viaje hacia el servidor (~119 B), eliminando sobrecarga repetida y evitando envíos innecesarios de orden de megabytes.
          </p>
        </div>

        {/* Global Weather Presets */}
        <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Escenarios:</span>
          </span>
          <button
            onClick={() => onApplyPreset('dry')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 font-medium cursor-pointer"
            title="Aplica régimen seco a todos los nodos"
          >
            ☀️ Día Seco
          </button>
          <button
            onClick={() => onApplyPreset('moderate')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 transition-colors border border-slate-700 font-medium cursor-pointer"
            title="Aplica lluvia moderada a todos los nodos"
          >
            🌦️ Lluvia Media
          </button>
          <button
            onClick={() => onApplyPreset('torrential')}
            className="px-2.5 py-1 text-xs rounded-md bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 transition-colors border border-amber-700/60 font-semibold cursor-pointer"
            title="Aplica crecida severa a todos los nodos"
          >
            ⛈️ Arroyo Crecido
          </button>
          <button
            onClick={() => onApplyPreset('extreme_flood')}
            className="px-2.5 py-1 text-xs rounded-md bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 transition-colors border border-rose-700/70 font-bold animate-pulse cursor-pointer"
            title="Genera avalancha digital máxima en todos los nodos"
          >
            🌊 Avalancha Total
          </button>
        </div>
      </div>

      {/* Grid of Individual Gateway Cards (Side-by-Side) */}
      <div className={`grid gap-4 ${gateways.length === 1
        ? 'grid-cols-1'
        : gateways.length === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : gateways.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
        {gateways.map((gw, idx) => {
          const env = gw.environment;
          const isSelected = selectedGatewayIndex === idx;

          return (
            <div
              key={gw.id}
              onClick={() => onSelectGateway(idx)}
              className={`p-3.5 rounded-xl border flex flex-col gap-3.5 transition-all ${isSelected
                ? 'bg-slate-950 border-sky-500/80 ring-1 ring-sky-500/30 shadow-lg'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{gw.name}</h4>
                    <span className="text-[10px] text-slate-400 block truncate max-w-40">{gw.location}</span>
                  </div>
                </div>

                {/* Total Demand Tag with Tabular Numerals */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Flujo d_{idx + 1}</span>
                  <div className="font-mono text-xs font-bold text-sky-300 bg-sky-950/90 px-1.5 py-0.5 rounded border border-sky-800/60 tabular-nums">
                    {gw.demand.toFixed(1)} <span className="text-[9px] text-sky-400 font-normal">paq/s</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-mono block mt-0.5 tabular-nums">
                    {gw.demandKBS.toFixed(2)} kB/s
                  </span>
                </div>
              </div>

              {/* Slider 1: Rain Intensity */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1 text-[11px] font-medium">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span>Lluvia / Precipitación</span>
                  </span>
                  <span className="font-mono font-bold text-sky-400 text-xs tabular-nums">
                    {env.rainIntensity} <span className="text-[10px] text-slate-400 font-normal">mm/h</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="1"
                  value={env.rainIntensity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateGatewayEnvironment(idx, {
                      ...env,
                      rainIntensity: val,
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>0 mm/h (Seco)</span>
                  <span>180 mm/h (Tormenta)</span>
                </div>
              </div>

              {/* Slider 2: Water Speed & Flow */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1 text-[11px] font-medium">
                    <Waves className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Velocidad de Arroyo</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-xs tabular-nums">
                    {env.waterSpeed.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">m/s</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="12.0"
                  step="0.1"
                  value={env.waterSpeed}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateGatewayEnvironment(idx, {
                      ...env,
                      waterSpeed: val,
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Caudal: ~{gw.sensors.speedSensor.waterFlow} m³/s</span>
                  <span>12.0 m/s (Crítico)</span>
                </div>
              </div>

              {/* Slider 3: Water Temperature */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1 text-[11px] font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temperatura del Agua</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-xs tabular-nums">
                    {env.waterTemp.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">°C</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="45"
                  step="0.5"
                  value={env.waterTemp}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateGatewayEnvironment(idx, {
                      ...env,
                      waterTemp: val,
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>18°C (Fría)</span>
                  <span>45°C (Alarma Bomba)</span>
                </div>
              </div>

              {/* Sensor Local Readings & Gateway JSON Aggregation Box */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Sensor Vel local (~20 B):
                  </span>
                  <span className="font-mono font-semibold text-sky-300 tabular-nums text-[10px]">
                    {gw.sensors.speedSensor.generationRate.toFixed(1)} paq/s
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Sensor Temp local (~20 B):
                  </span>
                  <span className="font-mono font-semibold text-amber-300 tabular-nums text-[10px]">
                    {gw.sensors.tempSensor.generationRate.toFixed(1)} paq/s
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> JSON Consolidado:
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">
                    ~119 B / viaje (-25% peaje)
                  </span>
                </div>
              </div>

              {/* Dedicated Node Spike Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerSpike(idx);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold shadow transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                title={`Dispara crecida repentina solo en ${gw.name}`}
              >
                <Zap className="w-3 h-3 text-rose-400" />
                <span>Crecida en este Nodo</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

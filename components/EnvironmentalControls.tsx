'use client';

import React from 'react';
import { EnvironmentalState, GatewayNodeState, WeatherPreset } from '@/lib/types';
import { createInitialEnvironmentalState } from '@/lib/simulation-engine';

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
  const currentGw = gateways[selectedGatewayIndex] || gateways[0];
  if (!currentGw) return null;

  const env = currentGw.environment;

  const handleRainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdateGatewayEnvironment(selectedGatewayIndex, {
      ...env,
      rainIntensity: val,
    });
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdateGatewayEnvironment(selectedGatewayIndex, {
      ...env,
      waterSpeed: val,
    });
  };

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onUpdateGatewayEnvironment(selectedGatewayIndex, {
      ...env,
      waterTemp: val,
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Header and Preset Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>🌦️ Control Ambiental por Nodo</span>
            <span className="text-xs font-normal text-slate-400">(Simulación Hidrológica Barranquilla)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manipule lluvia y caudal de cada nodo para generar avalanchas de datos hacia el servidor.
          </p>
        </div>

        {/* Global Weather Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1">Escenarios:</span>
          <button
            onClick={() => onApplyPreset('dry')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            title="Día seco con régimen de tráfico bajo"
          >
            ☀️ Día Seco
          </button>
          <button
            onClick={() => onApplyPreset('moderate')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 transition-colors border border-slate-700"
            title="Lluvia moderada en sectores urbanos"
          >
            🌦️ Lluvia Media
          </button>
          <button
            onClick={() => onApplyPreset('torrential')}
            className="px-2.5 py-1 text-xs rounded-md bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 transition-colors border border-amber-700/60 font-medium"
            title="Arroyos urbanos crecidos en Barranquilla"
          >
            ⛈️ Arroyo Crecido
          </button>
          <button
            onClick={() => onApplyPreset('extreme_flood')}
            className="px-2.5 py-1 text-xs rounded-md bg-rose-950/70 hover:bg-rose-900/70 text-rose-300 transition-colors border border-rose-700/60 font-semibold animate-pulse"
            title="Avalancha digital extrema: saturación y prueba de estrés"
          >
            🌊 Avalancha Digital
          </button>
        </div>
      </div>

      {/* Gateway Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {gateways.map((gw, idx) => {
          const isSelected = selectedGatewayIndex === idx;
          return (
            <button
              key={gw.id}
              onClick={() => onSelectGateway(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
                isSelected
                  ? 'bg-sky-950 border-sky-500 text-sky-200 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-slate-500'}`} />
              <span>{gw.name}</span>
              <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                d={gw.demand.toFixed(0)} paq/s
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Node Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        {/* Slider 1: Rain Intensity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <span>🌧️ Precipitación / Lluvia</span>
            </span>
            <span className="font-mono font-semibold text-sky-400">
              {env.rainIntensity} <span className="text-[10px] text-slate-400">mm/h</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={env.rainIntensity}
            onChange={handleRainChange}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0 (Seco)</span>
            <span>60 (Fuerte)</span>
            <span>180 (Tormenta)</span>
          </div>
        </div>

        {/* Slider 2: Water Speed & Flow */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <span>🌊 Velocidad de Arroyo</span>
            </span>
            <span className="font-mono font-semibold text-emerald-400">
              {env.waterSpeed.toFixed(1)} <span className="text-[10px] text-slate-400">m/s</span>
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="12.0"
            step="0.1"
            value={env.waterSpeed}
            onChange={handleSpeedChange}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.2 m/s (Calma)</span>
            <span>Caudal: ~{currentGw.sensors.speedSensor.waterFlow} m³/s</span>
            <span>12 m/s (Crítico)</span>
          </div>
        </div>

        {/* Slider 3: Water Temperature */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <span>🌡️ Temperatura del Agua</span>
            </span>
            <span className="font-mono font-semibold text-amber-400">
              {env.waterTemp.toFixed(1)} <span className="text-[10px] text-slate-400">°C</span>
            </span>
          </div>
          <input
            type="range"
            min="18"
            max="45"
            step="0.5"
            value={env.waterTemp}
            onChange={handleTempChange}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>18°C (Fría)</span>
            <span>26°C (Ambiente)</span>
            <span>45°C (Alerta Bomba)</span>
          </div>
        </div>
      </div>

      {/* Telemetry Output and Sudden Burst Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="text-slate-300">Sensor Velocidad:</span>
            <span className="font-mono font-semibold text-sky-400">
              {currentGw.sensors.speedSensor.generationRate} paq/s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Sensor Temperatura:</span>
            <span className="font-mono font-semibold text-amber-400">
              {currentGw.sensors.tempSensor.generationRate} paq/s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Demanda Total Nodo:</span>
            <span className="font-mono font-bold text-slate-100 bg-slate-700/60 px-1.5 py-0.5 rounded">
              d = {currentGw.demand.toFixed(1)} paq/s
            </span>
          </div>
        </div>

        <button
          onClick={() => onTriggerSpike(selectedGatewayIndex)}
          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md transition-all flex items-center gap-1.5 text-xs active:scale-95"
        >
          <span>⚡ Crecida Repentina en este Nodo</span>
        </button>
      </div>
    </div>
  );
}

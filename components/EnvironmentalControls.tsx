'use client';

import React from 'react';
import { EnvironmentalState, GatewayNodeState, WeatherPreset } from '@/lib/types';
import {
  EMPIRICAL_FLOW_SPEED_PAIRS,
  getFlowVelocityPair,
} from '@/lib/simulation-engine';
import { CloudRain, Waves, Zap, Layers, ShieldCheck, Gauge } from 'lucide-react';
import { MathBlock } from './MathBlock';

// Propiedades del panel de control ambiental e hidrológico por cada Gateway (Nivel 1 Heterogéneo)
interface EnvironmentalControlsProps {
  gateways: GatewayNodeState[];
  selectedGatewayIndex: number;
  onSelectGateway: (index: number) => void;
  onUpdateGatewayEnvironment: (index: number, newEnv: EnvironmentalState) => void;
  onUpdateGatewayLambda?: (index: number, newLambda: number) => void;
  onApplyPresetToSelected: (preset: WeatherPreset) => void;
  onApplyPresetToAll?: (preset: WeatherPreset) => void;
  onTriggerSpike: (index: number) => void;
}

/**
 * Panel interactivo de telemetría ambiental y parámetros de enlace por nodo (Nivel 1 Heterogéneo).
 * Permite ajustar la precipitación pluvial P [mm], el par hidrodinámico acoplado (Caudal Q, Velocidad v)
 * y la velocidad de propagación individual \lambda_k (retardo \tau_k = 1/\lambda_k) para cada Gateway IoT.
 */
export function EnvironmentalControls({
  gateways,
  selectedGatewayIndex,
  onSelectGateway,
  onUpdateGatewayEnvironment,
  onUpdateGatewayLambda,
  onApplyPresetToSelected,
  onApplyPresetToAll,
  onTriggerSpike,
}: EnvironmentalControlsProps) {
  const currentSelectedGw = gateways[selectedGatewayIndex] || gateways[0];

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Encabezado Superior e Indicador de Nodo Seleccionado */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CloudRain className="w-4 h-4" />
            </span>
            <span>Telemetría y Control Ambiental por Nodo</span>
            <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
              Pluviómetro + Sensor de Agua (Q y v acoplados) → JSON ~119 B
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Cada sensor genera una lectura local de ~20 B. El Gateway consolida las mediciones en un único paquete JSON de ~119 B (-24.7% peaje de red), descartando transmisiones directas innecesarias del orden de megabytes.
          </p>
        </div>

        {/* Indicador visual del Gateway objetivo para los escenarios rápidos */}
        <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px]">Nodo Objetivo:</span>
          <span className="font-bold text-sky-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            {currentSelectedGw ? currentSelectedGw.name : 'Gateway 1'}
          </span>
        </div>
      </div>

      {/* Barra de Escenarios Hidrometeorológicos Preconfigurados */}
      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Layers className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-medium">
            Escenario para <strong className="text-sky-300">{currentSelectedGw ? currentSelectedGw.name : 'Gateway'}</strong>:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onApplyPresetToSelected('dry')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700 font-medium cursor-pointer"
            title={`Aplica régimen seco (0.8 mm, 12 m³/s, 3.7 m/s) solo a ${currentSelectedGw?.name}`}
          >
            ☀️ Día Seco
          </button>
          <button
            type="button"
            onClick={() => onApplyPresetToSelected('moderate')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-sky-300 transition-colors border border-slate-700 font-medium cursor-pointer"
            title={`Aplica lluvia moderada (38 mm, 54 m³/s, 6.5 m/s) solo a ${currentSelectedGw?.name}`}
          >
            🌦️ Lluvia Media
          </button>
          <button
            type="button"
            onClick={() => onApplyPresetToSelected('torrential')}
            className="px-2.5 py-1 text-xs rounded-md bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 transition-colors border border-amber-700/60 font-semibold cursor-pointer"
            title={`Aplica régimen de canal crecido (93.7 mm, 94 m³/s, 7.5 m/s) solo a ${currentSelectedGw?.name}`}
          >
            ⛈️ Canal Crecido
          </button>
          <button
            type="button"
            onClick={() => onApplyPresetToSelected('extreme_flood')}
            className="px-2.5 py-1 text-xs rounded-md bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 transition-colors border border-rose-700/70 font-bold cursor-pointer"
            title={`Aplica crecida extrema (160.5 mm, 208 m³/s, 10.4 m/s) solo a ${currentSelectedGw?.name}`}
          >
            🌊 Avalancha Total
          </button>

          {onApplyPresetToAll && (
            <button
              type="button"
              onClick={() => onApplyPresetToAll('moderate')}
              className="ml-2 px-2 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/60 cursor-pointer"
              title="Aplica lluvia uniforme a todos los gateways en paralelo"
            >
              Aplicar a Todos
            </button>
          )}
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Telemetría por cada Gateway k ∈ {1, ..., N} */}
      <div className={`grid gap-4 ${
        gateways.length === 1
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
          const currentPair = getFlowVelocityPair(env.flowIndex);

          return (
            <div
              key={gw.id}
              onClick={() => onSelectGateway(idx)}
              className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-950 border-sky-500 ring-1 ring-sky-500/40 shadow-lg shadow-sky-950/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Encabezado de la Tarjeta del Gateway y Demanda d_k(t) */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-100">{gw.name}</h4>
                      <span className="text-[9px] font-mono bg-indigo-950/90 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                        L_{idx + 1}={gw.distanceKm} km · LoRa {gw.loraSF}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-44">{gw.location}</span>
                  </div>
                </div>

                {/* Etiqueta de Demanda d_k(t) en paq/s y kB/s */}
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 flex items-center justify-end gap-1">
                    <span>Flujo</span>
                    <MathBlock math={`d_{${idx + 1}}(t)`} />
                  </span>
                  <div className="font-mono text-xs font-bold text-sky-300 bg-sky-950/90 px-1.5 py-0.5 rounded border border-sky-800/60 tabular-nums">
                    {gw.demand.toFixed(1)} <span className="text-[9px] text-sky-400 font-normal">paq/s</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-mono block mt-0.5 tabular-nums">
                    {gw.demandKBS.toFixed(2)} kB/s
                  </span>
                </div>
              </div>

              {/* Sensor 1: Pluviómetro (Precipitación en mm) */}
              <div className="flex flex-col gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5 text-[11px] font-semibold">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span>Pluviómetro (Lluvia)</span>
                  </span>
                  <span className="font-mono font-bold text-sky-400 text-xs tabular-nums">
                    {env.rain_mm.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mm</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="0.8"
                  max="180.0"
                  step="0.5"
                  value={env.rain_mm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateGatewayEnvironment(idx, {
                      ...env,
                      rain_mm: val,
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />

                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>0.8 mm (Seco)</span>
                  <span className="text-slate-400">Pico Ref: 160.5 mm</span>
                  <span>180 mm (Tormenta)</span>
                </div>
              </div>

              {/* Sensor 2: Sensor de Agua (Caudal Q y Velocidad v acoplados de la tabla de 60 pares) */}
              <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5 text-[11px] font-semibold">
                    <Waves className="w-3.5 h-3.5 text-teal-400" />
                    <span>Sensor de Agua (Q y v acoplados)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    Nivel {env.flowIndex + 1}/60
                  </span>
                </div>

                {/* Visualización del Par Acoplado (Q, v) */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Caudal Q</span>
                    <span className="text-xs font-bold text-teal-300 tabular-nums">
                      {currentPair.flow} <span className="text-[9px] font-normal text-slate-400">m³/s</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Velocidad v</span>
                    <span className="text-xs font-bold text-emerald-300 tabular-nums">
                      {currentPair.speed.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">m/s</span>
                    </span>
                  </div>
                </div>

                {/* Control deslizante del índice empírico [0 - 59] */}
                <input
                  type="range"
                  min="0"
                  max={EMPIRICAL_FLOW_SPEED_PAIRS.length - 1}
                  step="1"
                  value={env.flowIndex}
                  onChange={(e) => {
                    const idxVal = Number(e.target.value);
                    const pair = getFlowVelocityPair(idxVal);
                    onUpdateGatewayEnvironment(idx, {
                      ...env,
                      flowIndex: idxVal,
                      waterFlow: pair.flow,
                      waterSpeed: pair.speed,
                    });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />

                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>12 m³/s (3.7 m/s)</span>
                  <span>208 m³/s (10.4 m/s)</span>
                </div>
              </div>

              {/* Parámetros Heterogéneos del Enlace LoRa k (Nivel 1): Distancia L_k, Velocidad \lambda_k y Retardo \tau_k = 1/\lambda_k */}
              <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-indigo-900/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 flex items-center gap-1.5 text-[11px] font-semibold">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Enlace LoRa <MathBlock math={`L_{${idx + 1}}=${gw.distanceKm}\\text{ km}`} /> ({gw.loraSF})</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-300 text-[11px] tabular-nums">
                    τ_{idx + 1} = {gw.tau.toFixed(2)}s
                  </span>
                </div>

                {onUpdateGatewayLambda && (
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={gw.lambda}
                    onChange={(e) => {
                      onUpdateGatewayLambda(idx, Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                )}

                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>λ_{idx + 1} = {gw.lambda.toFixed(2)} s⁻¹</span>
                  <span className="text-emerald-300">w_{idx + 1} = {gw.w.toFixed(2)}</span>
                  <span className="text-amber-300">u_{idx + 1} = {gw.u.toFixed(2)}</span>
                </div>
              </div>

              {/* Resumen de Telemetría Local, Contribución Ponderada y Empaquetado JSON */}
              <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Pluviómetro + Agua (~40 B crudos):
                  </span>
                  <span className="font-mono font-semibold text-sky-300 tabular-nums text-[10px]">
                    {(gw.sensors.rainSensor.generationRate + gw.sensors.waterSensor.generationRate).toFixed(1)} paq/s
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Flujo admitido <MathBlock math={`w_{${idx + 1}} d_{${idx + 1}}`} />:
                  </span>
                  <span className="font-mono font-semibold text-indigo-300 tabular-nums text-[10px]">
                    {(gw.w * gw.demand).toFixed(1)} paq/s
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Paquete Unificado Gateway:
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">
                    ~119 B / viaje (-24.7%)
                  </span>
                </div>
              </div>

              {/* Botón para disparar pico de crecida súbita en este canal */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerSpike(idx);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold shadow transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                title={`Dispara crecida hidrológica repentina solo en ${gw.name}`}
              >
                <Zap className="w-3 h-3 text-rose-400" />
                <span>Crecida en este Canal</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

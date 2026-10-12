'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationState, SimulationMode, WeatherPreset, EnvironmentalState } from '@/lib/types';
import {
  createInitialState,
  stepSimulation,
  createInitialEnvironmentalState,
  computeSensorTelemetry,
} from '@/lib/simulation-engine';
import { NetworkCanvas } from '@/components/NetworkCanvas';
import { RealTimeCharts } from '@/components/RealTimeCharts';
import { EnvironmentalControls } from '@/components/EnvironmentalControls';
import { SimulationToolbar } from '@/components/SimulationToolbar';
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { MathematicalReference } from '@/components/MathematicalReference';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [state, setState] = useState<SimulationState>(() => createInitialState(3, 'optimized'));
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [selectedGatewayIndex, setSelectedGatewayIndex] = useState<number>(0);

  // Use a ref for the mutable simulation state to keep RAF loop smooth at 60fps
  const stateRef = useRef<SimulationState>(state);
  stateRef.current = state;

  const lastFrameTimeRef = useRef<number>(performance.now());

  // Simulation Loop
  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      if (isRunning && deltaMs > 0) {
        // Cap dt to prevent massive jumps when tab is inactive
        const dt = Math.min(0.08, (deltaMs / 1000) * simSpeed);
        const nextState = stepSimulation(stateRef.current, dt);
        stateRef.current = nextState;
        setState(nextState);
      }

      animId = requestAnimationFrame(loop);
    };

    lastFrameTimeRef.current = performance.now();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRunning, simSpeed]);

  // Handler: Toggle Mode (Optimized vs Unoptimized)
  const handleToggleMode = useCallback((newMode: SimulationMode) => {
    setState((prev) => {
      const next = { ...prev, mode: newMode };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Handler: Change Number of Gateways (1 to 4)
  const handleChangeNumGateways = useCallback((count: number) => {
    setState((prev) => {
      const next = createInitialState(count, prev.mode);
      next.serverEpsilon = prev.serverEpsilon;
      stateRef.current = next;
      return next;
    });
    setSelectedGatewayIndex(0);
  }, []);

  // Handler: Change Server Max Processing Capacity (Epsilon)
  const handleChangeServerEpsilon = useCallback((newEpsilon: number) => {
    setState((prev) => {
      const next = {
        ...prev,
        serverEpsilon: newEpsilon,
        server: {
          ...prev.server,
          epsilon: newEpsilon,
        },
      };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Handler: Update Gateway Environment
  const handleUpdateGatewayEnvironment = useCallback((gwIndex: number, newEnv: EnvironmentalState) => {
    setState((prev) => {
      const updatedGws = prev.gateways.map((gw, idx) => {
        if (idx === gwIndex) {
          const telemetry = computeSensorTelemetry(newEnv);
          return {
            ...gw,
            environment: newEnv,
            sensors: {
              speedSensor: telemetry.speedSensor,
              tempSensor: telemetry.tempSensor,
            },
            demand: telemetry.totalDemand,
          };
        }
        return gw;
      });
      const next = { ...prev, gateways: updatedGws };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Handler: Apply Weather Preset across all gateways
  const handleApplyPreset = useCallback((preset: WeatherPreset) => {
    setState((prev) => {
      const newEnv = createInitialEnvironmentalState(preset);
      const updatedGws = prev.gateways.map((gw) => {
        const telemetry = computeSensorTelemetry(newEnv);
        return {
          ...gw,
          environment: { ...newEnv },
          sensors: {
            speedSensor: telemetry.speedSensor,
            tempSensor: telemetry.tempSensor,
          },
          demand: telemetry.totalDemand,
        };
      });
      const next = { ...prev, gateways: updatedGws };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Handler: Trigger Sudden Flood Spike in a gateway
  const handleTriggerSpike = useCallback((gwIndex: number) => {
    setState((prev) => {
      const updatedGws = prev.gateways.map((gw, idx) => {
        if (idx === gwIndex) {
          const spikedEnv: EnvironmentalState = {
            rainIntensity: 175,
            waterSpeed: 11.5,
            waterTemp: 24.0,
          };
          const telemetry = computeSensorTelemetry(spikedEnv);
          return {
            ...gw,
            environment: spikedEnv,
            sensors: {
              speedSensor: telemetry.speedSensor,
              tempSensor: telemetry.tempSensor,
            },
            demand: telemetry.totalDemand,
          };
        }
        return gw;
      });
      const next = { ...prev, gateways: updatedGws };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Handler: Reset Simulation
  const handleReset = useCallback(() => {
    setState((prev) => {
      const fresh = createInitialState(prev.numGateways, prev.mode);
      fresh.serverEpsilon = prev.serverEpsilon;
      fresh.server.epsilon = prev.serverEpsilon;
      stateRef.current = fresh;
      return fresh;
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Activity className="w-5 h-5 text-indigo-400" />
              </span>
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Cero DesBorde: Simulación Híbrida PDE–ODE</span>
                <span className="hidden sm:inline-block text-xs font-normal text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/50">
                  Red de Sensores Hidrológicos
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Estación Inteligente de Bombeo y Control de Inundaciones • Barranquilla | Universidad de la Costa (CUC) - CIA Ecuaciones Diferenciales 2026-2
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-300">
                Proyecto Grupo 24382
              </div>
              <div className="text-[11px] text-slate-400">
                G. Arenas, S. Barrins, J. Estrada, L. Mendoza
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
              state.mode === 'optimized'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 ring-1 ring-emerald-500/20'
                : 'bg-rose-950/80 text-rose-300 border-rose-600/80 ring-1 ring-rose-500/20'
            }`}>
              {state.mode === 'optimized' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Modo Optimizado (ISS)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Modo No Optimizado (FIFO)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex flex-col gap-6 flex-1">
        {/* Simulation Controls Toolbar */}
        <SimulationToolbar
          mode={state.mode}
          onToggleMode={handleToggleMode}
          numGateways={state.numGateways}
          onChangeNumGateways={handleChangeNumGateways}
          serverEpsilon={state.serverEpsilon}
          onChangeServerEpsilon={handleChangeServerEpsilon}
          isRunning={isRunning}
          onTogglePlayPause={() => setIsRunning(!isRunning)}
          onReset={handleReset}
          simSpeed={simSpeed}
          onChangeSimSpeed={setSimSpeed}
        />

        {/* Real-Time KPIs & Bottleneck Alert Banner */}
        <PerformanceMetrics state={state} />

        {/* Interactive Visual Network Canvas */}
        <div className="w-full h-[400px] lg:h-[460px]">
          <NetworkCanvas
            state={state}
            selectedGatewayIndex={selectedGatewayIndex}
            onSelectGateway={setSelectedGatewayIndex}
          />
        </div>

        {/* Environmental Sliders & Node Controls */}
        <EnvironmentalControls
          gateways={state.gateways}
          selectedGatewayIndex={selectedGatewayIndex}
          onSelectGateway={setSelectedGatewayIndex}
          onUpdateGatewayEnvironment={handleUpdateGatewayEnvironment}
          onApplyPreset={handleApplyPreset}
          onTriggerSpike={handleTriggerSpike}
        />

        {/* Real-time Analytical Charts */}
        <RealTimeCharts state={state} />

        {/* Deep Mathematical & Engineering Theory Reference */}
        <MathematicalReference />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Modelado PDE–ODE del Tráfico de Datos en Redes de Sensores de Drenaje Urbano • Barranquilla
          </div>
          <div>
            Basado en la formulación de Espitia, Girard, Marchand y Prieur | Componente Integrador CIA 2026-2
          </div>
        </div>
      </footer>
    </div>
  );
}

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
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  BarChart3,
  BookOpen,
  LayoutGrid,
  CheckCircle2,
  HardDrive,
  Cpu,
} from 'lucide-react';

// Secciones disponibles en la navegación del dashboard
type ActiveSection = 'simulation' | 'charts' | 'formulas' | 'all';

/**
 * Vista principal del Dashboard Interactivo "Cero DesBorde: Simulación Híbrida PDE–ODE".
 * Gestiona el ciclo de integración numérica en tiempo real (~60 FPS en motor, ~15 FPS en UI),
 * la topología de N Gateways y los escenarios hidrometeorológicos.
 */
export default function Home() {
  // Estado global de la simulación (inicia con 3 Gateways en Modo Optimizado ISS)
  const [state, setState] = useState<SimulationState>(() => createInitialState(3, 'optimized'));
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [selectedGatewayIndex, setSelectedGatewayIndex] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<ActiveSection>('simulation');

  // Referencia mutable para avanzar el motor físico de forma fluida en requestAnimationFrame
  const stateRef = useRef<SimulationState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lastFrameTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  // Bucle principal de integración numérica PDE-ODE con limitación de refresco DOM (~15 FPS)
  // para mantener nitidez tipográfica en las cifras en vivo
  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      if (isRunning && deltaMs > 0) {
        // Acotar el paso dt para evitar saltos bruscos si la pestaña estuvo en segundo plano
        const dt = Math.min(0.08, (deltaMs / 1000) * simSpeed);
        const nextState = stepSimulation(stateRef.current, dt);
        stateRef.current = nextState;

        // Actualizar el estado de React cada ~65 ms (~15 FPS)
        if (currentTime - lastUiUpdateRef.current >= 65) {
          lastUiUpdateRef.current = currentTime;
          setState(nextState);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    lastFrameTimeRef.current = performance.now();
    lastUiUpdateRef.current = performance.now();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRunning, simSpeed]);

  // Manejador: Alternar modalidad de control (Optimizado ISS vs No Optimizado FIFO)
  const handleToggleMode = useCallback((newMode: SimulationMode) => {
    setState((prev) => {
      // Reinicializar desde condiciones limpias preservando el número de Gateways y la capacidad \varepsilon
      const next = createInitialState(prev.numGateways, newMode);
      next.serverEpsilon = prev.serverEpsilon;
      next.server.epsilon = prev.serverEpsilon;
      next.server.epsilonKBS = Number(((prev.serverEpsilon * 119) / 1000).toFixed(2));

      stateRef.current = next;
      lastFrameTimeRef.current = performance.now();
      lastUiUpdateRef.current = performance.now();
      return next;
    });
  }, []);

  // Manejador: Cambiar la cantidad de Gateways / Líneas de Transmisión PDE (1 a 4)
  const handleChangeNumGateways = useCallback((count: number) => {
    setState((prev) => {
      const next = createInitialState(count, prev.mode);
      next.serverEpsilon = prev.serverEpsilon;
      next.server.epsilon = prev.serverEpsilon;
      next.server.epsilonKBS = Number(((prev.serverEpsilon * 119) / 1000).toFixed(2));
      stateRef.current = next;
      return next;
    });
    setSelectedGatewayIndex(0);
  }, []);

  // Manejador: Modificar la capacidad máxima asintótica de procesamiento del Servidor (\varepsilon)
  const handleChangeServerEpsilon = useCallback((newEpsilon: number) => {
    setState((prev) => {
      const next = {
        ...prev,
        serverEpsilon: newEpsilon,
        server: {
          ...prev.server,
          epsilon: newEpsilon,
          epsilonKBS: Number(((newEpsilon * 119) / 1000).toFixed(2)),
        },
      };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Manejador: Actualizar condiciones hidrometeorológicas de un Gateway específico
  const handleUpdateGatewayEnvironment = useCallback((gwIndex: number, newEnv: EnvironmentalState) => {
    if (stateRef.current && stateRef.current.gateways && stateRef.current.gateways[gwIndex]) {
      const telemetry = computeSensorTelemetry(newEnv);
      stateRef.current.gateways[gwIndex].environment = { ...newEnv };
      stateRef.current.gateways[gwIndex].sensors = {
        rainSensor: { ...telemetry.rainSensor },
        waterSensor: { ...telemetry.waterSensor },
      };
      stateRef.current.gateways[gwIndex].demand = telemetry.totalDemand;
    }

    setState((prev) => {
      const updatedGws = prev.gateways.map((gw, idx) => {
        if (idx === gwIndex) {
          const telemetry = computeSensorTelemetry(newEnv);
          return {
            ...gw,
            environment: { ...newEnv },
            sensors: {
              rainSensor: { ...telemetry.rainSensor },
              waterSensor: { ...telemetry.waterSensor },
            },
            demand: telemetry.totalDemand,
          };
        }
        return gw;
      });
      return { ...prev, gateways: updatedGws };
    });
  }, []);

  // Manejador: Aplicar escenario meteorológico únicamente al Gateway seleccionado actualmente
  const handleApplyPresetToSelected = useCallback((preset: WeatherPreset) => {
    const newEnv = createInitialEnvironmentalState(preset);
    const targetIdx = selectedGatewayIndex;

    if (stateRef.current && stateRef.current.gateways && stateRef.current.gateways[targetIdx]) {
      const telemetry = computeSensorTelemetry(newEnv);
      stateRef.current.gateways[targetIdx].environment = { ...newEnv };
      stateRef.current.gateways[targetIdx].sensors = {
        rainSensor: { ...telemetry.rainSensor },
        waterSensor: { ...telemetry.waterSensor },
      };
      stateRef.current.gateways[targetIdx].demand = telemetry.totalDemand;
    }

    setState((prev) => {
      const updatedGws = prev.gateways.map((gw, idx) => {
        if (idx === targetIdx) {
          const telemetry = computeSensorTelemetry(newEnv);
          return {
            ...gw,
            environment: { ...newEnv },
            sensors: {
              rainSensor: { ...telemetry.rainSensor },
              waterSensor: { ...telemetry.waterSensor },
            },
            demand: telemetry.totalDemand,
          };
        }
        return gw;
      });
      return { ...prev, gateways: updatedGws };
    });
  }, [selectedGatewayIndex]);

  // Manejador: Aplicar escenario meteorológico simultáneamente a todos los Gateways
  const handleApplyPresetToAll = useCallback((preset: WeatherPreset) => {
    const newEnv = createInitialEnvironmentalState(preset);
    if (stateRef.current && stateRef.current.gateways) {
      stateRef.current.gateways.forEach((gw) => {
        const telemetry = computeSensorTelemetry(newEnv);
        gw.environment = { ...newEnv };
        gw.sensors = {
          rainSensor: { ...telemetry.rainSensor },
          waterSensor: { ...telemetry.waterSensor },
        };
        gw.demand = telemetry.totalDemand;
      });
    }

    setState((prev) => {
      const updatedGws = prev.gateways.map((gw) => {
        const telemetry = computeSensorTelemetry(newEnv);
        return {
          ...gw,
          environment: { ...newEnv },
          sensors: {
            rainSensor: { ...telemetry.rainSensor },
            waterSensor: { ...telemetry.waterSensor },
          },
          demand: telemetry.totalDemand,
        };
      });
      return { ...prev, gateways: updatedGws };
    });
  }, []);

  // Manejador: Disparar pico súbito de crecida extrema en un Gateway individual
  const handleTriggerSpike = useCallback((gwIndex: number) => {
    const spikedEnv = createInitialEnvironmentalState('extreme_flood');

    if (stateRef.current && stateRef.current.gateways && stateRef.current.gateways[gwIndex]) {
      const telemetry = computeSensorTelemetry(spikedEnv);
      stateRef.current.gateways[gwIndex].environment = { ...spikedEnv };
      stateRef.current.gateways[gwIndex].sensors = {
        rainSensor: { ...telemetry.rainSensor },
        waterSensor: { ...telemetry.waterSensor },
      };
      stateRef.current.gateways[gwIndex].demand = telemetry.totalDemand;
    }

    setState((prev) => {
      const updatedGws = prev.gateways.map((gw, idx) => {
        if (idx === gwIndex) {
          const telemetry = computeSensorTelemetry(spikedEnv);
          return {
            ...gw,
            environment: { ...spikedEnv },
            sensors: {
              rainSensor: { ...telemetry.rainSensor },
              waterSensor: { ...telemetry.waterSensor },
            },
            demand: telemetry.totalDemand,
          };
        }
        return gw;
      });
      return { ...prev, gateways: updatedGws };
    });
  }, []);

  // Manejador: Reiniciar la simulación a las condiciones iniciales
  const handleReset = useCallback(() => {
    const fresh = createInitialState(stateRef.current.numGateways, stateRef.current.mode);
    fresh.serverEpsilon = stateRef.current.serverEpsilon;
    fresh.server.epsilon = stateRef.current.serverEpsilon;
    fresh.server.epsilonKBS = Number(((stateRef.current.serverEpsilon * 119) / 1000).toFixed(2));
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Encabezado Superior Institucional */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Activity className="w-5 h-5 text-indigo-400" />
              </span>
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Cero DesBorde: Simulación Híbrida PDE–ODE</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-300">
                Grupo 24392
              </div>
              <div className="text-[11px] text-slate-400">
                G. Arenas, S. Barrios, J. Estrada, L. Mendoza
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm ${state.mode === 'optimized'
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

      {/* Barra de Navegación por Secciones */}
      <div className="border-b border-slate-800 bg-slate-900/60 sticky top-15 z-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('simulation')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeSection === 'simulation'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Sliders className="w-4 h-4" />
              <span>1. Simulación y Topología</span>
            </button>

            <button
              onClick={() => setActiveSection('charts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeSection === 'charts'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>2. Gráficas y Métricas</span>
            </button>

            <button
              onClick={() => setActiveSection('formulas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeSection === 'formulas'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>3. Fórmulas y Fundamentos</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pl-4">
            <button
              onClick={() => setActiveSection(activeSection === 'all' ? 'simulation' : 'all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${activeSection === 'all'
                ? 'bg-slate-800 border-indigo-500 text-indigo-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              title="Muestra las 3 secciones continuas en pantalla"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{activeSection === 'all' ? 'Vista por Pestañas' : 'Ver Todo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal del Dashboard */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex flex-col gap-8 flex-1">
        {/* Barra de Herramientas y Métricas Globales (siempre visibles) */}
        <div className="flex flex-col gap-4">
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

          <PerformanceMetrics state={state} />
        </div>

        {/* SECCIÓN 1: SIMULACIÓN Y TOPOLOGÍA */}
        {(activeSection === 'simulation' || activeSection === 'all') && (
          <section className="flex flex-col gap-5 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Sección 1: Simulación de Tráfico de Red y Topología IoT</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Líneas PDE: {state.gateways.length} | Retardo τ = {state.tau}s
              </span>
            </div>

            {/* Lienzo Visual de la Red PDE-ODE */}
            <div className="w-full h-100 lg:h-115">
              <NetworkCanvas
                state={state}
                selectedGatewayIndex={selectedGatewayIndex}
                onSelectGateway={setSelectedGatewayIndex}
              />
            </div>

            {/* Controles Ambientales e Hidrológicos por Nodo */}
            <EnvironmentalControls
              gateways={state.gateways}
              selectedGatewayIndex={selectedGatewayIndex}
              onSelectGateway={setSelectedGatewayIndex}
              onUpdateGatewayEnvironment={handleUpdateGatewayEnvironment}
              onApplyPresetToSelected={handleApplyPresetToSelected}
              onApplyPresetToAll={handleApplyPresetToAll}
              onTriggerSpike={handleTriggerSpike}
            />
          </section>
        )}

        {/* SECCIÓN 2: GRÁFICAS Y ANÁLISIS EN TIEMPO REAL */}
        {(activeSection === 'charts' || activeSection === 'all') && (
          <section className="flex flex-col gap-5 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Sección 2: Monitoreo Analítico en Tiempo Real y Comportamiento de Colas</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Historial de Ventana Temporal: 70 muestras (~18s)
              </span>
            </div>

            {/* Gráficas Analíticas en Tiempo Real */}
            <RealTimeCharts state={state} />

            {/* Tarjetas de Resumen Técnico y Ahorro de Ancho de Banda */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarjeta 1: Ahorro por Consolidación en Gateway */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Ahorro Consolidación Gateway</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-2">
                  <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                    ~24.7%
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Reducción neta de sobrecarga en cabeceras de red por el empaquetado JSON de ~119 Bytes.
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-300/80 border-t border-slate-800 pt-2">
                  Total ahorrado: {state.gateways.reduce((a, g) => a + g.bandwidthSavedKB, 0).toFixed(1)} kB acumulados
                </div>
              </div>

              {/* Tarjeta 2: Escala Real Física del Búfer del Servidor */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Escala Real de Búfer Servidor</span>
                  <HardDrive className="w-4 h-4 text-sky-400" />
                </div>
                <div className="my-2">
                  <div className="font-mono text-2xl font-bold text-sky-400 tabular-nums">
                    {state.server.bufferKB.toFixed(2)} kB
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Capacidad máxima física: 120 paquetes (<strong>14.28 kB</strong>). Ningún paquete de telemetría se acerca a 1 MB.
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                  Ocupación: {((state.server.buffer / state.server.bufferCapacity) * 100).toFixed(1)}% del búfer
                </div>
              </div>

              {/* Tarjeta 3: Caudal de Procesamiento (Throughput) */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Throughput Servidor</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="my-2">
                  <div className="font-mono text-2xl font-bold text-purple-400 tabular-nums">
                    {state.server.processingRateKBS.toFixed(2)} kB/s
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Procesando {state.server.processingRate.toFixed(1)} paq/s de un límite asintótico ε = {state.server.epsilon} paq/s.
                  </div>
                </div>
                <div className="text-[11px] font-mono text-purple-300/80 border-t border-slate-800 pt-2">
                  Inflow total: {state.server.inflowKBS.toFixed(2)} kB/s ({state.server.inflow.toFixed(1)} paq/s)
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 3: FÓRMULAS Y FUNDAMENTOS MATEMÁTICOS */}
        {(activeSection === 'formulas' || activeSection === 'all') && (
          <section className="flex flex-col gap-5 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Sección 3: Formulación Matemática PDE–ODE y Modelo Hidrológico</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Ecuaciones de Ondas Cinemáticas &amp; Colas Continuas Acopladas
              </span>
            </div>

            {/* Componente de Fundamentación Matemática */}
            <MathematicalReference />
          </section>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Modelado PDE–ODE del Tráfico de Datos en Redes de Sensores de Drenaje Urbano
          </div>
          <div>
            Basado en la formulación de Espitia, Girard, Marchand y Prieur | Componente Integrador CIA 2026-2
          </div>
        </div>
      </footer>
    </div>
  );
}

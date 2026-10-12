'use client';

import React, { useState } from 'react';
import { MathBlock } from './MathBlock';
import { BookOpen, ChevronDown, ChevronUp, GraduationCap, Cpu, Waves } from 'lucide-react';

export function MathematicalReference() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Fundamentación Teórica y Formulación Matemática PDE–ODE</span>
              <span className="text-xs font-normal text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                CUC CIA 2026-2
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Desarrollo analítico según el proyecto &quot;Cero DesBorde&quot; (Espitia, Girard, Marchand y Prieur)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-medium">{isOpen ? 'Ocultar Ecuaciones' : 'Ver Ecuaciones y Deducción'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col gap-6 text-sm text-slate-300">
          {/* Institutional Header */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                Componente Integrador de Aprendizaje (CIA) • Ecuaciones Diferenciales
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                Optimización de Estación Inteligente de Bombeo para Control de Inundaciones en Barranquilla
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Autores: Gabriel Arenas, Sebastián Barrins, Jesús Estrada, Leandro Mendoza • Universidad de la Costa (CUC)
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-mono">
              Grupo 24382
            </div>
          </div>

          {/* Grid of Formulas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: PDE Transport */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                <Waves className="w-4 h-4" />
                <span>1. PDE: Dinámica del Tránsito (Línea de Transmisión)</span>
              </div>
              <p className="text-xs text-slate-400">
                Modela el desplazamiento advectivo continuo de paquetes de datos a lo largo de la línea normalizada <MathBlock math="x \in [0, 1]" />:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
                <MathBlock math="\frac{\partial q_{ij}(t, x)}{\partial t} + \lambda_{ij} \frac{\partial q_{ij}(t, x)}{\partial x} = 0" block />
              </div>
              <p className="text-xs text-slate-400">
                Por el <strong>método de las características</strong>, <MathBlock math="x(t) - \lambda t = C" />. El retardo de transporte a la llegada (<MathBlock math="x=1" />) es:
              </p>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center font-mono text-xs text-sky-300">
                <MathBlock math="\tau_{ij} = \frac{1}{\lambda_{ij}}, \quad q_{ij}(t, 1) = u_{ij}(t - \tau_{ij}) r_i(z_i(t - \tau_{ij}))" />
              </div>
            </div>

            {/* Box 2: ODE Buffer Balance */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                <Cpu className="w-4 h-4" />
                <span>2. ODE: Balance de Masa en el Búfer (Servidor / Nodos)</span>
              </div>
              <p className="text-xs text-slate-400">
                La variación temporal de datos acumulados <MathBlock math="z_i(t)" /> es igual a las entradas admitidas menos las salidas procesadas:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
                <MathBlock math="\frac{dz_i(t)}{dt} = w_i(t) d_i(t) + \sum_{k \in \mathcal{U}_i} w_i(t) q_{ki}(t, 1) - r_i(z_i(t))" block />
              </div>
              <p className="text-xs text-slate-400">
                Donde <MathBlock math="d_i" /> es la demanda física generada por los sensores y <MathBlock math="w_i \in [0, 1]" /> es el factor de admisión y descarte preventivo.
              </p>
            </div>

            {/* Box 3: Non-linear Processing Function */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <BookOpen className="w-4 h-4" />
                <span>3. Tasa de Procesamiento y Saturación No Lineal</span>
              </div>
              <p className="text-xs text-slate-400">
                Con un tiempo medio de residencia <MathBlock math="\theta_i(z_i) = \frac{1 + z_i}{\epsilon_i}" />, la tasa de salida es:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
                <MathBlock math="r_i(z_i) = \frac{\epsilon_i z_i}{1 + z_i}" block />
              </div>
              <p className="text-xs text-slate-400">
                Cumple que <MathBlock math="r_i(0) = 0" /> y para <MathBlock math="z_i \to \infty" />, <MathBlock math="r_i(z_i) \to \epsilon_i" /> (capacidad asintótica máxima de CPU). Derivada estrictamente decreciente en aceleración: <MathBlock math="r_i'(z_i) = \frac{\epsilon_i}{(1 + z_i)^2} > 0" />.
              </p>
            </div>

            {/* Box 4: Algebraic Equilibrium */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <GraduationCap className="w-4 h-4" />
                <span>4. Punto de Equilibrio Analítico z* y Condición ISS</span>
              </div>
              <p className="text-xs text-slate-400">
                En régimen permanente (<MathBlock math="dz/dt = 0" /> y <MathBlock math="z(t-\tau) = z^*" />), despejando algebraicamente:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
                <MathBlock math="z^* = \frac{w \cdot d}{(1 - w \cdot u)\epsilon - w \cdot d}" block />
              </div>
              <p className="text-xs text-slate-400">
                <strong>Condición de estabilidad y no desborde:</strong>
              </p>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center text-xs text-emerald-400 font-mono font-bold">
                <MathBlock math="w \cdot d < (1 - w \cdot u)\epsilon" />
              </div>
            </div>
          </div>

          {/* Comparison Explanation: Optimized vs Unoptimized */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              ¿Por qué se produce el Cuello de Botella y cómo lo elimina el Modo Optimizado?
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50">
                <span className="font-bold text-rose-300 block mb-1">
                  ❌ Modo No Optimizado (Convencional FIFO):
                </span>
                <p className="text-slate-300">
                  Opera con admisión estática ciega <MathBlock math="w = 1" /> y ruteo estático <MathBlock math="u = 1" />. Durante un aguacero en Barranquilla, la crecida de los arroyos dispara la telemetría a una tasa que supera la capacidad de procesamiento del servidor (<MathBlock math="d > \epsilon" />).
                </p>
                <p className="mt-2 text-rose-200/90">
                  El balance neto <MathBlock math="dz/dt = d - r(z) > d - \epsilon > 0" /> es siempre positivo. La cola colisiona con el tope físico <MathBlock math="Z_{max}" />, produciendo <strong>saturación de búfer, descarte masivo continuo de paquetes y retardo infinito</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50">
                <span className="font-bold text-emerald-300 block mb-1">
                  ✅ Modo Optimizado (Control Híbrido Cero DesBorde):
                </span>
                <p className="text-slate-300">
                  Implementa <strong>Control en Lazo Cerrado con Estabilidad Entrada-Estado (ISS)</strong>. Modula dinámicamente el factor de admisión <MathBlock math="w_i(t)" /> en el gateway mediante muestreo adaptativo y compresión de telemetría antes de saturar el canal, y balancea la carga con <MathBlock math="u_{ij}(t)" />.
                </p>
                <p className="mt-2 text-emerald-200/90">
                  Garantiza activamente que <MathBlock math="w d < (1 - wu)\epsilon" />, logrando que el búfer converja al punto de equilibrio <MathBlock math="z^*" /> seguro. <strong>¡Se elimina el cuello de botella, el descarte de paquetes se reduce a cero (0%), y el sistema de bombeo mantiene visibilidad crítica continua!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

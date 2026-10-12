'use client';

import React, { useState } from 'react';
import { MathBlock } from './MathBlock';
import { BookOpen, ChevronDown, ChevronUp, GraduationCap, Cpu, Waves, Table } from 'lucide-react';

export function MathematicalReference() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Fundamentación Teórica, Unidades y Formulación Matemática PDE–ODE</span>
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
          <span className="text-xs font-medium">{isOpen ? 'Ocultar Ecuaciones y Unidades' : 'Ver Ecuaciones y Unidades'}</span>
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

          {/* Section: Technical Variables and Units */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Table className="w-4 h-4" />
              <span>Variables Técnicas y Análisis Dimensional Consistente</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3 font-semibold">Variable</th>
                    <th className="py-2 px-3 font-semibold">Definición Física / Matemática</th>
                    <th className="py-2 px-3 font-semibold">Unidad Infografía</th>
                    <th className="py-2 px-3 font-semibold">Equivalencia en Cola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">t</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Tiempo de operación del sistema</td>
                    <td className="py-2 px-3 text-slate-200">Segundos [s]</td>
                    <td className="py-2 px-3 text-slate-400">s</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">x</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Posición espacial normalizada en la línea</td>
                    <td className="py-2 px-3 text-slate-200">Adimensional [0, 1]</td>
                    <td className="py-2 px-3 text-slate-400">Canal i → j</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">z_i(t)</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Contenido acumulado en el búfer lógico del nodo o servidor</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">Megabits [Mb]</td>
                    <td className="py-2 px-3 text-slate-400">Paquetes normalizados</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">q_ij(t, x)</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Densidad de datos en tránsito por la línea de comunicación</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">Megabits [Mb]</td>
                    <td className="py-2 px-3 text-slate-400">Paquetes / longitud</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">d_i(t)</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Demanda externa generada por sensores (caudal y temperatura)</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">Megabits/segundo [Mb/s]</td>
                    <td className="py-2 px-3 text-slate-400">Paquetes/segundo</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">r_i(z_i)</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Tasa de salida o procesamiento del nodo/servidor</td>
                    <td className="py-2 px-3 text-purple-400 font-bold">Megabits/segundo [Mb/s]</td>
                    <td className="py-2 px-3 text-slate-400">Paquetes/segundo</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">ε_i</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Capacidad máxima asintótica de procesamiento del servidor</td>
                    <td className="py-2 px-3 text-purple-400 font-bold">Mb/s</td>
                    <td className="py-2 px-3 text-slate-400">Paquetes/segundo máx</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">λ_ij</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Velocidad efectiva de propagación en la coordenada normalizada</td>
                    <td className="py-2 px-3 text-slate-200">s⁻¹</td>
                    <td className="py-2 px-3 text-slate-400">1 / s</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sky-400 font-bold">τ_ij = 1/λ_ij</td>
                    <td className="py-2 px-3 font-sans text-slate-300">Retardo de transporte físico por la línea (x = 1)</td>
                    <td className="py-2 px-3 text-slate-200">Segundos [s]</td>
                    <td className="py-2 px-3 text-slate-400">s</td>
                  </tr>
                </tbody>
              </table>
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
                La variación temporal de datos acumulados <MathBlock math="z_i(t)" /> [Mb] es igual a las entradas admitidas menos las salidas procesadas:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
                <MathBlock math="\frac{dz_i(t)}{dt} = w_i(t) d_i(t) + \sum_{k \in \mathcal{U}_i} w_i(t) q_{ki}(t, 1) - r_i(z_i(t)) \quad [\text{Mb/s}]" block />
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
                <MathBlock math="r_i(z_i) = \frac{\epsilon_i z_i}{1 + z_i} \quad [\text{Mb/s}]" block />
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
                <MathBlock math="z^* = \frac{w \cdot d}{(1 - w \cdot u)\epsilon - w \cdot d} \quad [\text{Mb}]" block />
              </div>
              <p className="text-xs text-slate-400">
                <strong>Condición de estabilidad y no desborde:</strong>
              </p>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center text-xs text-emerald-400 font-mono font-bold">
                <MathBlock math="w \cdot d < (1 - w \cdot u)\epsilon \quad [\text{Mb/s}]" />
              </div>
            </div>
          </div>

          {/* Section: Calculation of Packets / Sensor Telemetry */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              5. Cálculo Físico de la Demanda de Sensores d_k(t) [Mb/s]
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-sky-300 block mb-1">
                  🌊 Sensor de Velocidad y Caudal de Arroyo:
                </span>
                <p className="text-slate-300">
                  En calma (v ≈ 0.2 m/s), genera una tasa base de 4.0 Mb/s. Ante crecida turbulenta (v en m/s) y lluvia (R en mm/h), activa muestreo de alta resolución:
                </p>
                <div className="bg-slate-900 p-2 rounded text-center my-1 font-mono text-sky-400">
                  <MathBlock math="d_{\text{vel}}(R, v) = 4.0 + 0.35 \cdot R + 4.2 \cdot (v - 0.2) \quad [\text{Mb/s}]" />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1">
                  🌡️ Sensor de Temperatura del Agua:
                </span>
                <p className="text-slate-300">
                  Registra desviaciones térmicas respecto a 26°C y monitoreo térmico de las bombas durante precipitaciones:
                </p>
                <div className="bg-slate-900 p-2 rounded text-center my-1 font-mono text-amber-400">
                  <MathBlock math="d_{\text{temp}}(R, T) = 2.5 + 0.12 \cdot |T - 26| + 0.08 \cdot R \quad [\text{Mb/s}]" />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              La demanda combinada de cada nodo es <MathBlock math="d_k(t) = d_{\text{vel}, k} + d_{\text{temp}, k}" /> [paq/s o kB/s].
            </p>
          </div>

          {/* Section 6: IoT Gateway Consolidation & Bandwidth Savings */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>🛡️ 6. Arquitectura IoT: Gateway Intermediario, Paquetes de ~119 Bytes y Ahorro del 25%</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">
                  📡 Transmisión Convencional Sin Gateway (Doble Peaje de Red):
                </span>
                <p className="text-slate-300">
                  Si el sensor de velocidad y el de temperatura transmitieran directamente e individualmente por Internet al servidor:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-400 text-[11px]">
                  <li>Sensor de velocidad: ~20 B de lectura + ~54 B de cabeceras IP/UDP = ~79 B</li>
                  <li>Sensor de temperatura: ~20 B de lectura + ~54 B de cabeceras IP/UDP = ~79 B</li>
                  <li>Total en viajes separados: <strong>~158 Bytes por ciclo</strong></li>
                  <li>Genera sobrecarga innecesaria por duplicación de cabeceras de red.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50">
                <span className="font-bold text-emerald-300 block mb-1">
                  ⚡ Optimización con Gateway IoT Intermediario:
                </span>
                <p className="text-slate-300">
                  El Gateway recibe las lecturas locales de ~20 B cada una, las unifica junto a una marca de tiempo en un solo formato estructurado (JSON) y realiza un <strong>único viaje</strong> hacia el servidor central:
                </p>
                <div className="bg-slate-950 p-2 rounded mt-2 font-mono text-[10px] text-emerald-300 border border-slate-800">
                  &#123;&quot;gw&quot;:1, &quot;ts&quot;:1776092400, &quot;spd&quot;:7.4, &quot;flow&quot;:18.2, &quot;temp&quot;:24.5&#125;
                </div>
                <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Peso final consolidado con cabeceras:</span>
                  <strong className="text-emerald-400 font-mono">~119 Bytes / viaje</strong>
                </div>
                <div className="mt-1 text-[11px] text-emerald-300 font-semibold">
                  Ahorro de ancho de banda: ~24.7% (≈ 25% menos sobrecarga de red).
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <strong>Conclusión Técnica de Escala:</strong> El paquete resultante unificado es sumamente ligero (~119 Bytes = 0.119 kB). Bajo ninguna circunstancia este tipo de mediciones IoT en tiempo real debería acercarse a 1 MB, demostrando que la consolidación en el Gateway elimina la sobrecarga repetida y estabiliza el transporte PDE–ODE en la escala correcta de bytes y kilobytes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

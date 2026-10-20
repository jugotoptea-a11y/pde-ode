'use client';

import React from 'react';
import { MathBlock } from './MathBlock';
import { GraduationCap, Table, Waves, Cpu, BookOpen, ShieldCheck, CloudRain } from 'lucide-react';

/**
 * Componente de Referencia Matemática y Fundamentación Teórica PDE–ODE.
 * Presenta la tabla tipificada de variables, las ecuaciones diferenciales acopladas,
 * la reducción escalar homogénea sobre las N líneas de transmisión y la arquitectura IoT.
 */
export function MathematicalReference() {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-6 text-sm text-slate-300">
      {/* Encabezado Institucional del Proyecto */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">
              Componente Integrador de Aprendizaje (CIA) • Ecuaciones Diferenciales
            </div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              Fundamentación Teórica, Variables y Formulación Matemática Completa PDE–ODE
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Desarrollo analítico de Espitia, Girard, Marchand y Prieur • Universidad de la Costa (CUC)
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-mono self-start sm:self-center">
          Grupo 24392
        </div>
      </div>

      {/* Sección 1: Tabla Exhaustiva de Variables y Parámetros del Modelo */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Table className="w-4 h-4" />
            <span>1. Tabla Exhaustiva de Variables y Parámetros del Modelo (Documento PDF)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            19 variables y parámetros formalmente tipificados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Variable / Parámetro</th>
                <th className="py-2.5 px-3 font-semibold">Definición Matemática y Significado Físico</th>
                <th className="py-2.5 px-3 font-semibold">Unidad Documento</th>
                <th className="py-2.5 px-3 font-semibold">Equivalencia en Simulación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {/* 1. t */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="t" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Tiempo continuo de operación del sistema de telemetría y drenaje.
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Segundos [s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">s</td>
              </tr>

              {/* 2. x */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="x \in [0, 1]" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Posición espacial normalizada a lo largo de cada canal de transmisión (<MathBlock math="x=0" /> emisor, <MathBlock math="x=1" /> receptor).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Adimensional [0, 1]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">Canal Gateway k → Servidor</td>
              </tr>

              {/* 3. q_ij(t, x) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="q_{ij}(t, x)" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Flujo o densidad de tráfico de datos en tránsito por la línea que conecta el nodo <MathBlock math="i" /> con el nodo <MathBlock math="j" />.
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">Megabits [Mb]</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Paquetes/s en tránsito</td>
              </tr>

              {/* 4. \lambda_ij */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="\lambda_{k} > 0" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Velocidad efectiva de propagación LoRa en coordenada normalizada (<MathBlock math="\lambda_k = v_{\text{LoRa},k}/L_k" />, según Factor de Dispersión SF7–SF10 y distancia).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">s⁻¹</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">λₖ ∈ [0.90, 2.40] s⁻¹</td>
              </tr>

              {/* 5. z_i(t) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="z_i(t)" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Cantidad de datos acumulados en el búfer lógico de almacenamiento del nodo/servidor <MathBlock math="i" />.
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">Megabits [Mb]</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Paquetes (~119 B c/u)</td>
              </tr>

              {/* 6. d_i(t) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="d(t) = \sum_{k=1}^N d_k(t)" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Demanda externa agregada generada por las <MathBlock math="N" /> estaciones de sensores (pluviómetro y sensor de agua).
                </td>
                <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">Megabits/segundo [Mb/s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Paquetes/s y kB/s</td>
              </tr>

              {/* 7. w_i(t) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="w_i(t) \in [0, 1]" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Factor dinámico de admisión del tráfico en el nodo <MathBlock math="i" /> (mecanismo de regulación preventiva de descarte).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Adimensional [0, 1]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">Control ISS (0.05 a 1.0)</td>
              </tr>

              {/* 8. u_ij(t) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="u = \sum_{k=1}^N u_{ki} \in [0, 1)" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Fracción agregada de enrutamiento/multiplexado (<MathBlock math="u_{ki} = u/N" /> por línea; <MathBlock math="1-u" /> es el caudal neto evacuado).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Adimensional [0, 1)</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">u = 0.20 (u_k = 0.20/N)</td>
              </tr>

              {/* 9. r_i(z_i) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="r_i(z_i)" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Tasa no lineal de procesamiento o salida de datos del nodo <MathBlock math="i" /> hacia el canal o consumidor.
                </td>
                <td className="py-2.5 px-3 font-mono text-purple-400 font-semibold">Megabits/segundo [Mb/s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Paquetes/s y kB/s</td>
              </tr>

              {/* 10. \varepsilon_i */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="\varepsilon_i > 0" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Capacidad límite o asintótica máxima de procesamiento computacional del nodo/servidor.
                </td>
                <td className="py-2.5 px-3 font-mono text-purple-400 font-semibold">Mb/s</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Límite ε (15 a 180 paq/s)</td>
              </tr>

              {/* 11. \tau_ij */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="\tau_{k} = \frac{1}{\lambda_{k}}" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Tiempo de retardo físico de tránsito LoRa (Time-on-Air + propagación) por cada línea <MathBlock math="k" /> (<MathBlock math="x \in [0, 1]" />).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Segundos [s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">τₖ ∈ [0.42, 1.11] s</td>
              </tr>

              {/* 12. \theta_i(z_i) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="\theta_i(z_i) = \frac{1 + z_i}{\varepsilon_i}" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Tiempo medio de residencia o permanencia de los datos en el búfer del nodo <MathBlock math="i" />.
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Segundos [s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">s</td>
              </tr>

              {/* 13. \mathcal{U}_i */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="\mathcal{U}_i" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Conjunto de nodos emisores conectados que transmiten tráfico hacia el nodo receptor <MathBlock math="i" />.
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Conjunto topológico</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">&#123;GW₁, ..., GW_N&#125;</td>
              </tr>

              {/* 14. q_ij^0(x) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="q_{ij}^0(x)" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Perfil o distribución inicial de tráfico presente en la línea antes del arribo de la condición de frontera (<MathBlock math="t < x/\lambda_{ij}" />).
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">Megabits [Mb]</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Condición inicial PDE</td>
              </tr>

              {/* 15. t_0 */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="t_0 = t - \frac{x}{\lambda_{ij}}" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Instante temporal en que la curva característica partió de la frontera emisora <MathBlock math="x = 0" />.
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Segundos [s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">s</td>
              </tr>

              {/* 16. z^* */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="z^*" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Punto de equilibrio analítico algebraico del búfer en régimen estacionario (<MathBlock math="dz/dt = 0" />).
                </td>
                <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">Megabits [Mb]</td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Paquetes en equilibrio</td>
              </tr>

              {/* 17. z_0 */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="z_0" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Cantidad o escala de referencia del búfer que normaliza la expresión para consistencia dimensional: <MathBlock math="r(z) = \varepsilon \frac{z/z_0}{1 + z/z_0}" />.
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Unidades de búfer</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">1 paq (normalizado)</td>
              </tr>

              {/* 18. L y v */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="L_k, \ v_{\text{LoRa}, k}" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Distancia del enlace LoRa y velocidad efectiva de modulación Chirp Spread Spectrum (<MathBlock math="\tau_k = L_k / v_{\text{LoRa},k}" />).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">Metros [m] y [m/s]</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">Enlace LoRa (SF7–SF10)</td>
              </tr>

              {/* 19. r'_i(z_i) */}
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2.5 px-3 text-indigo-300 font-semibold text-sm">
                  <MathBlock math="r_i'(z_i) = \frac{\varepsilon_i}{(1 + z_i)^2}" />
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-300">
                  Derivada marginal de la tasa de procesamiento; estrictamente positiva y decreciente (rendimientos marginales decrecientes).
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-300">s⁻¹</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">Pendiente de servicio</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Derivación Matemática de las Ecuaciones Diferenciales (Nivel 1 Heterogéneo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Caja 1: Transporte PDE por Características con Retardos Distintos \tau_k */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
            <Waves className="w-4 h-4" />
            <span>2. PDE: Tránsito Multilínea con Retardos Distintos τₖ (Fase I, Pasos 1–8)</span>
          </div>
          <p className="text-xs text-slate-400">
            Cada línea <MathBlock math="k \in \{1, \dots, N\}" /> tiene su propia velocidad <MathBlock math="\lambda_k > 0" /> y retardo <MathBlock math="\tau_k = 1/\lambda_k" />:
          </p>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
            <MathBlock math="\frac{\partial q_{ki}(t, x)}{\partial t} + \lambda_k \frac{\partial q_{ki}(t, x)}{\partial x} = 0" block />
          </div>
          <p className="text-xs text-slate-400">
            Sobre las rectas características <MathBlock math="t_0 = t - x/\lambda_k" />, el flujo que arriba al servidor (<MathBlock math="x = 1" />) es:
          </p>
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center font-mono text-xs text-sky-300">
            <MathBlock math="\tau_k = \frac{1}{\lambda_k}, \quad q_{ki}(t, 1) = w_k d_k(t - \tau_k) + w_k u_{ki}\, r(z(t - \tau_k))" />
          </div>
        </div>

        {/* Caja 2: Balance ODE Multirretardo en el Servidor Central */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
            <Cpu className="w-4 h-4" />
            <span>3. ODE: Balance Multirretardo en el Servidor Central (Fase II, Paso 9)</span>
          </div>
          <p className="text-xs text-slate-400">
            En el régimen transitorio, al Servidor Central confluyen las <MathBlock math="N" /> líneas con retardos distintos <MathBlock math="\tau_k" />:
          </p>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
            <MathBlock math="\frac{dz}{dt} = \sum_{k=1}^N \left[ w_k d_k(t - \tau_k) + w_k u_{ki} \frac{\varepsilon\, z(t - \tau_k)}{1 + z(t - \tau_k)} \right] - \frac{\varepsilon\, z(t)}{1 + z(t)}" block />
          </div>
          <p className="text-xs text-slate-400">
            Si los enlaces son homogéneos (<MathBlock math="\tau_k = \tau, \ w_k = w" />), se recupera la DDE escalar con <MathBlock math="d = \sum d_k" /> y <MathBlock math="u = \sum u_{ki}" />.
          </p>
        </div>

        {/* Caja 3: Función No Lineal de Procesamiento y Suma Ponderada */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <BookOpen className="w-4 h-4" />
            <span>4. Tasa de Servicio en Equilibrio por Suma Ponderada (Nivel 1)</span>
          </div>
          <p className="text-xs text-slate-400">
            En estado estacionario (<MathBlock math="dz/dt = 0" />, <MathBlock math="z(t-\tau_k) = z^*" />), la tasa de servicio requerida es la suma ponderada:
          </p>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
            <MathBlock math="r(z^*) = \frac{\varepsilon z^*}{1 + z^*} = \frac{\sum_{k=1}^N w_k d_k}{1 - \sum_{k=1}^N w_k u_{ki}}" block />
          </div>
          <p className="text-xs text-slate-400">
            Cumple <MathBlock math="r(0) = 0" /> y asíntota límite <MathBlock math="\lim_{z \to \infty} r(z) = \varepsilon" />. Para <MathBlock math="w_k = w" />, se reduce a <MathBlock math="r(z^*) = \frac{wd}{1-wu}" />.
          </p>
        </div>

        {/* Caja 4: Equilibrio Algebraico Heterogéneo y Condición ISS */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <GraduationCap className="w-4 h-4" />
            <span className="flex items-center gap-1">5. Punto de Equilibrio <MathBlock math="z^*" /> y Condición ISS (Pasos 10–16)</span>
          </div>
          <p className="text-xs text-slate-400">
            Despejando <MathBlock math="z^*" /> de la suma ponderada heterogénea (y su caso homogéneo equivalente):
          </p>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center my-1 overflow-x-auto">
            <MathBlock math="z^* = \frac{\sum_{k=1}^N w_k d_k}{\left(1 - \sum_{k=1}^N w_k u_{ki}\right)\varepsilon - \sum_{k=1}^N w_k d_k} \;\;\xrightarrow{w_k = w}\;\; \frac{w d}{(1 - w u)\varepsilon - w d}" block />
          </div>
          <p className="text-xs text-slate-400">
            <strong>Condición analítica de existencia física y Cero Desborde:</strong>
          </p>
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center text-xs text-emerald-400 font-mono font-bold">
            <MathBlock math="\sum_{k=1}^N w_k d_k < \left(1 - \sum_{k=1}^N w_k u_{ki}\right)\varepsilon" />
          </div>
        </div>
      </div>

      {/* Sección 3: Ejemplo Numérico Ilustrativo */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>6. Ejemplo Numérico de Verificación Algebraica</span>
        </div>
        <p className="text-xs text-slate-400">
          Con parámetros ilustrativos <MathBlock math="w = 0.8, \ u = 0.5, \ d = 10, \ \varepsilon = 20" />:
        </p>
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center font-mono text-xs text-sky-300 overflow-x-auto">
          <MathBlock math="z^* = \frac{0.8 \times 10}{(1 - 0.8 \times 0.5) \times 20 - 0.8 \times 10} = \frac{8}{(1 - 0.4) \times 20 - 8} = \frac{8}{12 - 8} = \frac{8}{4} = 2" block />
        </div>
        <p className="text-xs text-slate-400">
          El equilibrio teórico calculado es exactamente <MathBlock math="z^* = 2" /> paquetes en el búfer, cumpliendo <MathBlock math="r(z^*) = 20 \cdot \frac{2}{3} = \frac{8}{0.6} = 13.33\text{ paq/s}" />.
        </p>
      </div>

      {/* Sección 4: Telemetría de Sensores e Hidrología */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-sky-400" />
          <span>7. Modelado de Sensores: Pluviómetro y Sensor de Agua (Q y v acoplados)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="font-bold text-sky-300 block mb-1">
              Pluviómetro (Precipitación Acumulada):
            </span>
            <p className="text-slate-300 leading-relaxed">
              Basado en el <strong>rango histórico de referencia pluviométrica</strong> (desde 0.8 mm en estiaje seco hasta 160.5 mm en el pico histórico registrado, extensible a 180 mm en eventos extremos).
            </p>
            <div className="bg-slate-950 p-2 rounded text-center my-2 font-mono text-sky-400 border border-slate-800">
              <MathBlock math="d_{\text{pluv}}(P) = 3.0 + 0.28 \cdot P \quad [\text{paq/s}]" />
            </div>
            <p className="text-[11px] text-slate-400">
              Cada lectura física local pesa ~20 Bytes.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="font-bold text-teal-300 block mb-1">
              Sensor de Agua (Caudal Q y Velocidad v Acoplados):
            </span>
            <p className="text-slate-300 leading-relaxed">
              Mide simultáneamente el caudal estimado <MathBlock math="Q \text{ [m}^3\text{/s]}" /> y la velocidad media <MathBlock math="v \text{ [m/s]}" /> acoplados según la matriz de 60 mediciones empíricas de campo (de <MathBlock math="12\text{ m}^3\text{/s}, 3.7\text{ m/s}" /> hasta <MathBlock math="208\text{ m}^3\text{/s}, 10.4\text{ m/s}" />).
            </p>
            <div className="bg-slate-950 p-2 rounded text-center my-2 font-mono text-teal-400 border border-slate-800">
              <MathBlock math="d_{\text{water}}(Q, v) = 3.5 + 0.18 \cdot Q + 2.2 \cdot (v - 3.5) \quad [\text{paq/s}]" />
            </div>
            <p className="text-[11px] text-slate-400">
              Ambas variables viajan juntas localmente en una única lectura de ~20 Bytes.
            </p>
          </div>
        </div>
      </div>

      {/* Sección 5: Consolidación en Gateway y Ahorro de Ancho de Banda */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-900/60 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>8. Arquitectura IoT: Consolidación en Gateway, Paquete de ~119 Bytes y Ahorro del 24.7%</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">
              Transmisión Convencional Sin Gateway (Doble Peaje de Red):
            </span>
            <p className="text-slate-300 leading-relaxed">
              Si el pluviómetro y el sensor de agua transmitieran individualmente a través de Internet al servidor central:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 text-[11px]">
              <li>Pluviómetro: ~20 B de lectura + ~59 B cabeceras IP/UDP = ~79 B</li>
              <li>Sensor de Agua: ~20 B de lectura + ~59 B cabeceras IP/UDP = ~79 B</li>
              <li>Total en viajes separados: <strong>~158 Bytes por ciclo</strong></li>
              <li>Genera sobrecarga repetitiva por duplicación innecesaria de cabeceras.</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50">
            <span className="font-bold text-emerald-300 block mb-1">
              Optimización con Gateway Intermediario (Un solo Viaje):
            </span>
            <p className="text-slate-300 leading-relaxed">
              El Gateway recibe ambas lecturas locales de ~20 B, las consolida junto a un timestamp en una sola estructura JSON liviana y efectúa <strong>un único viaje</strong> de red:
            </p>
            <div className="bg-slate-950 p-2 rounded mt-2 font-mono text-[10px] text-emerald-300 border border-slate-800">
              &#123;&quot;gw&quot;:1, &quot;ts&quot;:1776092400, &quot;rain&quot;:45.2, &quot;flow&quot;:76, &quot;spd&quot;:7.4&#125;
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

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
          <strong>Conclusión Técnica de Escala:</strong> El paquete resultante unificado es sumamente ligero (~119 Bytes = 0.119 kB). Bajo ninguna circunstancia este tipo de mediciones IoT en tiempo real debería acercarse a 1 MB, demostrando que la consolidación en el Gateway elimina la sobrecarga repetida y estabiliza el transporte PDE–ODE en la escala correcta de bytes y kilobytes.
        </div>
      </div>
    </div>
  );
}

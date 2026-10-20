'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SimulationState } from '@/lib/types';
import { SERVER_MAX_BUFFER, nonlinearProcessingRate, SPATIAL_POINTS } from '@/lib/simulation-engine';
import { MathBlock } from './MathBlock';

// Propiedades del módulo de gráficas analíticas en tiempo real
interface RealTimeChartsProps {
  state: SimulationState;
}

/**
 * Componente de visualización gráfica en tiempo real mediante Canvas HTML5 de alta resolución.
 * Incluye 4 vistas analíticas:
 * 1) 'buffer': Evolución temporal del búfer z(t) frente al equilibrio analítico z* y el límite físico Z_max.
 * 2) 'rates': Tasas de flujo de entrada \sum q_{ki}(t, 1), salida procesada r(z) y tasa de descarte.
 * 3) 'saturation': Curva de saturación no lineal r(z) = \varepsilon z / (1 + z) y punto de operación instantáneo.
 * 4) 'spatial': Perfil espacial de densidad q_{ki}(t, x) a lo largo de las N líneas de transmisión x ∈ [0, 1].
 */
export function RealTimeCharts({ state }: RealTimeChartsProps) {
  const [activeTab, setActiveTab] = useState<'buffer' | 'rates' | 'saturation' | 'spatial'>('buffer');
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(2, window.devicePixelRatio || 1);
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Fondo limpio de la gráfica
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, width, height);

      // Margen derecho reservado para etiquetas de umbrales (evita superposición con las curvas)
      const padding = { top: 26, right: 115, bottom: 36, left: 75 };
      const plotW = Math.max(10, width - padding.left - padding.right);
      const plotH = Math.max(10, height - padding.top - padding.bottom);
      const plotRight = width - padding.right;

      // Líneas horizontales de la cuadrícula
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(plotRight, y);
        ctx.stroke();
      }

      if (activeTab === 'buffer') {
        // --- PESTAÑA 1: DINÁMICA DEL BÚFER DEL SERVIDOR z(t) vs EQUILIBRIO z* ---
        const history = state.history;
        const maxBufferY = SERVER_MAX_BUFFER * 1.08;

        // Línea de umbral físico máximo Z_max (roja punteada)
        const zMaxY = padding.top + plotH * (1 - SERVER_MAX_BUFFER / maxBufferY);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(padding.left, zMaxY);
        ctx.lineTo(plotRight, zMaxY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Etiqueta de Z_max en el margen derecho
        const zMaxBadgeX = plotRight + 8;
        ctx.beginPath();
        ctx.roundRect(zMaxBadgeX, zMaxY - 10, 96, 20, 4);
        ctx.fillStyle = '#22080a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Z_max: ${SERVER_MAX_BUFFER} paq`, zMaxBadgeX + 48, zMaxY + 4);

        // Línea del punto de equilibrio analítico z* (cian punteada)
        if (state.server.isEquilibriumFinite && state.server.zEquilibrium < maxBufferY) {
          const zStarY = padding.top + plotH * (1 - state.server.zEquilibrium / maxBufferY);
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.moveTo(padding.left, zStarY);
          ctx.lineTo(plotRight, zStarY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Etiqueta de z* en el margen derecho (con ajuste anticolisión respecto a Z_max)
          let zStarBadgeY = zStarY - 10;
          if (Math.abs(zStarY - zMaxY) < 22) {
            zStarBadgeY = zMaxY + 12;
          }
          zStarBadgeY = Math.max(padding.top, Math.min(height - padding.bottom - 20, zStarBadgeY));

          const zStarBadgeX = plotRight + 8;
          ctx.beginPath();
          ctx.roundRect(zStarBadgeX, zStarBadgeY, 96, 20, 4);
          ctx.fillStyle = '#061726';
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#7dd3fc';
          ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`z* = ${state.server.zEquilibrium.toFixed(1)} paq`, zStarBadgeX + 48, zStarBadgeY + 14);
        }

        // Curva de trayectoria temporal del búfer z(t)
        if (history.length > 1) {
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - Math.min(SERVER_MAX_BUFFER, pt.buffer) / maxBufferY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });

          const isBottleneck = state.mode === 'unoptimized' && state.server.isBottleneck;
          ctx.strokeStyle = isBottleneck ? '#ef4444' : '#10b981';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Relleno degradado bajo la curva z(t)
          const areaGrad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
          if (isBottleneck) {
            areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
            areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
          } else {
            areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
          }

          ctx.lineTo(plotRight, height - padding.bottom);
          ctx.lineTo(padding.left, height - padding.bottom);
          ctx.closePath();
          ctx.fillStyle = areaGrad;
          ctx.fill();
        }

        // Etiquetas del eje vertical Y
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${SERVER_MAX_BUFFER} paq`, padding.left - 10, zMaxY + 4);
        ctx.fillText(`${Math.round(SERVER_MAX_BUFFER / 2)} paq`, padding.left - 10, padding.top + plotH / 2 + 4);
        ctx.fillText('0 paq', padding.left - 10, height - padding.bottom + 4);

        // Etiqueta del eje horizontal X
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tiempo de simulación (ventana de 18s) →', padding.left + plotW / 2, height - padding.bottom + 22);

      } else if (activeTab === 'rates') {
        // --- PESTAÑA 2: FLUJOS DE ENTRADA \sum q_{ki}(t, 1), SALIDA r(z) Y DESCARTES ---
        const history = state.history;
        const maxRateY = Math.max(state.server.epsilon * 1.35, ...history.map((h) => Math.max(h.inflow, h.totalDemand))) + 8;

        if (history.length > 1) {
          // Curva de flujo entrante al servidor q(1) (azul cielo)
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - pt.inflow / maxRateY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Curva de tasa de procesamiento r(z) (púrpura)
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - pt.processingRate / maxRateY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Curva de tasa de descarte por overflow (rojo)
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - pt.droppedRate / maxRateY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Asíntota de capacidad máxima de procesamiento \varepsilon
        const epsY = padding.top + plotH * (1 - state.server.epsilon / maxRateY);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(padding.left, epsY);
        ctx.lineTo(plotRight, epsY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Etiqueta de \varepsilon en el margen derecho
        const epsBadgeX = plotRight + 8;
        ctx.beginPath();
        ctx.roundRect(epsBadgeX, epsY - 10, 96, 20, 4);
        ctx.fillStyle = '#1c0e29';
        ctx.fill();
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#e9d5ff';
        ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`ε: ${state.server.epsilon} paq/s`, epsBadgeX + 48, epsY + 4);

        // Etiquetas de ejes
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(maxRateY)} paq/s`, padding.left - 10, padding.top + 8);
        ctx.fillText('0 paq/s', padding.left - 10, height - padding.bottom + 4);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tiempo de simulación (ventana de 18s) →', padding.left + plotW / 2, height - padding.bottom + 22);

      } else if (activeTab === 'saturation') {
        // --- PESTAÑA 3: CURVA DE SATURACIÓN NO LINEAL r(z) = \varepsilon z / (1 + z) ---
        const eps = state.server.epsilon;
        const maxZ = SERVER_MAX_BUFFER;
        const maxR = eps * 1.15;

        // Línea de asíntota horizontal \varepsilon
        const epsY = padding.top + plotH * (1 - eps / maxR);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(padding.left, epsY);
        ctx.lineTo(plotRight, epsY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Etiqueta de asíntota en el margen derecho
        const satBadgeX = plotRight + 8;
        ctx.beginPath();
        ctx.roundRect(satBadgeX, epsY - 10, 96, 20, 4);
        ctx.fillStyle = '#261b05';
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`ε: ${eps} paq/s`, satBadgeX + 48, epsY + 4);

        // Trazo de la curva teórica r(z)
        ctx.beginPath();
        const steps = 100;
        for (let s = 0; s <= steps; s++) {
          const zVal = (s / steps) * maxZ;
          const rVal = nonlinearProcessingRate(zVal, eps);
          const x = padding.left + (plotW / steps) * s;
          const y = padding.top + plotH * (1 - rVal / maxR);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Punto de operación actual (z(t), r(z(t))) sobre la curva cóncava
        const currentZ = Math.min(maxZ, state.server.buffer);
        const currentR = nonlinearProcessingRate(currentZ, eps);
        const curX = padding.left + (currentZ / maxZ) * plotW;
        const curY = padding.top + plotH * (1 - currentR / maxR);

        ctx.beginPath();
        ctx.arc(curX, curY, 7, 0, Math.PI * 2);
        ctx.fillStyle = state.server.isBottleneck ? '#ef4444' : '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Líneas de proyección hacia los ejes coordenados
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX, height - padding.bottom);
        ctx.moveTo(curX, curY);
        ctx.lineTo(padding.left, curY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Etiquetas de ejes
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${eps} paq/s`, padding.left - 10, epsY + 4);
        ctx.fillText('0 paq/s', padding.left - 10, height - padding.bottom + 4);

        ctx.textAlign = 'center';
        ctx.fillText('0 paq', padding.left, height - padding.bottom + 18);
        ctx.fillText(`${maxZ} paq`, plotRight, height - padding.bottom + 18);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px system-ui, -apple-system, sans-serif';
        ctx.fillText('Búfer acumulado z [paquetes] →', padding.left + plotW / 2, height - padding.bottom + 22);

      } else if (activeTab === 'spatial') {
        // --- PESTAÑA 4: PERFIL ESPACIAL PDE q_{ki}(t, x) EN LAS N LÍNEAS ---
        const maxQ = Math.max(40, ...state.gateways.flatMap((g) => g.spatialQ)) + 5;

        state.gateways.forEach((g, gIdx) => {
          const colors = ['#38bdf8', '#2dd4bf', '#a78bfa', '#f43f5e'];
          const color = colors[gIdx % colors.length];

          ctx.beginPath();
          g.spatialQ.forEach((val, m) => {
            const x = padding.left + (plotW / (SPATIAL_POINTS - 1)) * m;
            const y = padding.top + plotH * (1 - val / maxQ);
            if (m === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        });

        // Etiquetas de las fronteras x = 0 y x = 1
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('x = 0 (Salida Gateway)', padding.left, height - padding.bottom + 18);
        ctx.textAlign = 'right';
        ctx.fillText('x = 1 (Entrada Servidor)', plotRight, height - padding.bottom + 18);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Coordenada espacial normalizada x ∈ [0, 1] →', padding.left + plotW / 2, height - padding.bottom + 22);

        // Etiquetas del eje Y
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(maxQ)} paq/s`, padding.left - 10, padding.top + 8);
        ctx.fillText('0 paq/s', padding.left - 10, height - padding.bottom + 4);
      }

      ctx.restore();
    };

    render();
    const animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, activeTab]);

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Barra Superior de Pestañas de Gráficas y Leyenda Reactiva */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/70 gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pestaña 1: Búfer */}
          <button
            onClick={() => setActiveTab('buffer')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'buffer'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Dinámica del Búfer</span>
            <MathBlock math="z(t)" className="text-white" />
            <span>vs</span>
            <MathBlock math="z^*" className="text-white" />
          </button>

          {/* Pestaña 2: Flujos */}
          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'rates'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Flujos de Entrada y Salida</span>
          </button>

          {/* Pestaña 3: Saturación */}
          <button
            onClick={() => setActiveTab('saturation')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'saturation'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Saturación No Lineal</span>
            <MathBlock math="r(z)" className="text-white" />
          </button>

          {/* Pestaña 4: Perfil Espacial PDE */}
          <button
            onClick={() => setActiveTab('spatial')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'spatial'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Perfil Espacial PDE</span>
            <MathBlock math="q(x)" className="text-white" />
          </button>
        </div>

        {/* Insignias Dinámicas con Expresiones KaTeX en Tiempo Real */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {activeTab === 'buffer' && (
            <>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                <MathBlock math="z(t):" />
                <span className="font-bold">{state.server.buffer.toFixed(1)} paq</span>
                <span className="text-[10px] text-emerald-400">({state.server.bufferKB.toFixed(1)} kB)</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300">
                <MathBlock math="z^*_{\text{eq}}:" />
                <span className="font-bold">
                  {state.server.isEquilibriumFinite ? `${state.server.zEquilibrium.toFixed(1)} paq` : '∞ (Inestable)'}
                </span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-800/60 text-rose-300">
                <MathBlock math="Z_{\max}:" />
                <span className="font-bold">{SERVER_MAX_BUFFER} paq</span>
              </div>
            </>
          )}

          {activeTab === 'rates' && (
            <>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300">
                <MathBlock math="q(1)\text{ [in]}:" />
                <span className="font-bold">{state.server.inflow.toFixed(1)} paq/s</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300">
                <MathBlock math="r(z)\text{ [out]}:" />
                <span className="font-bold">{state.server.processingRate.toFixed(1)} paq/s</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-800/60 text-rose-300">
                <span>Descartes:</span>
                <span className="font-bold">{Math.floor(state.server.totalDropped)} paq</span>
              </div>
            </>
          )}

          {activeTab === 'saturation' && (
            <>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
                <MathBlock math="r(z) = \frac{\varepsilon z}{1 + z}" />
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800/60 text-amber-300">
                <MathBlock math="\varepsilon:" />
                <span className="font-bold">{state.server.epsilon} paq/s</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300">
                <MathBlock math="r(z)/\varepsilon:" />
                <span className="font-bold">{state.server.cpuUtilization.toFixed(0)}%</span>
              </div>
            </>
          )}

          {activeTab === 'spatial' && (
            <>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
                <MathBlock math="\frac{\partial q}{\partial t} + \lambda \frac{\partial q}{\partial x} = 0" />
              </div>

              {state.gateways.map((g, i) => (
                <div key={g.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                  <MathBlock math={`q_{${i + 1}}(0):`} />
                  <span className="font-bold">{(g.spatialQ[0] || g.demand).toFixed(1)} paq/s</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Lienzo de Gráfica */}
      <div className="w-full h-72 lg:h-80 relative">
        <canvas ref={chartCanvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}

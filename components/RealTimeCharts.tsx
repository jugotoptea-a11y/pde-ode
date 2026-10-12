'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SimulationState } from '@/lib/types';
import { SERVER_MAX_BUFFER, nonlinearProcessingRate, SPATIAL_POINTS } from '@/lib/simulation-engine';

interface RealTimeChartsProps {
  state: SimulationState;
}

export function RealTimeCharts({ state }: RealTimeChartsProps) {
  const [activeTab, setActiveTab] = useState<'buffer' | 'rates' | 'saturation' | 'spatial'>('buffer');
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const padding = { top: 30, right: 25, bottom: 35, left: 55 };
      const plotW = width - padding.left - padding.right;
      const plotH = height - padding.top - padding.bottom;

      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      if (activeTab === 'buffer') {
        // TAB 1: Server Buffer z(t) vs Time with z* Equilibrium & Z_max Limit
        const history = state.history;
        const maxBufferY = SERVER_MAX_BUFFER * 1.05;

        // Draw Z_max Threshold Line (Red Dashed)
        const zMaxY = padding.top + plotH * (1 - SERVER_MAX_BUFFER / maxBufferY);
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.moveTo(padding.left, zMaxY);
        ctx.lineTo(width - padding.right, zMaxY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Límite Físico Z_max (${SERVER_MAX_BUFFER} paq / ${(SERVER_MAX_BUFFER * 0.119).toFixed(1)} kB)`, width - padding.right, zMaxY - 4);

        // Draw z* Equilibrium Line (Cyan Dashed) if finite
        if (state.server.isEquilibriumFinite && state.server.zEquilibrium < maxBufferY) {
          const zStarY = padding.top + plotH * (1 - state.server.zEquilibrium / maxBufferY);
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.moveTo(padding.left, zStarY);
          ctx.lineTo(width - padding.right, zStarY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`Equilibrio Teórico z* (${state.server.zEquilibrium.toFixed(1)} paq / ${(state.server.zEquilibrium * 0.119).toFixed(1)} kB)`, padding.left + 8, zStarY - 4);
        }

        // Draw Buffer Trajectory
        if (history.length > 1) {
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - Math.min(SERVER_MAX_BUFFER, pt.buffer) / maxBufferY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });

          // Gradient fill under curve
          const areaGrad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
          if (state.mode === 'unoptimized' && state.server.isBottleneck) {
            areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
            ctx.strokeStyle = '#ef4444';
          } else {
            areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
            ctx.strokeStyle = '#10b981';
          }
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Fill area
          const lastX = padding.left + plotW;
          const firstX = padding.left;
          ctx.lineTo(lastX, height - padding.bottom);
          ctx.lineTo(firstX, height - padding.bottom);
          ctx.closePath();
          ctx.fillStyle = areaGrad;
          ctx.fill();
        }

        // Y-axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${SERVER_MAX_BUFFER} paq`, padding.left - 8, zMaxY + 3);
        ctx.fillText(`${Math.round(SERVER_MAX_BUFFER / 2)}`, padding.left - 8, padding.top + plotH / 2 + 3);
        ctx.fillText('0', padding.left - 8, height - padding.bottom + 3);

        // Title and Legend
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('Evolución del Búfer del Servidor z(t) [paquetes & kB] vs Capacidad y Equilibrio', padding.left, 18);

      } else if (activeTab === 'rates') {
        // TAB 2: Traffic Rates (Inflow vs Processed Rate vs Dropped Rate)
        const history = state.history;
        const maxRateY = Math.max(state.server.epsilon * 1.5, ...history.map((h) => Math.max(h.inflow, h.totalDemand))) + 10;

        // Draw Inflow (Blue)
        if (history.length > 1) {
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - pt.inflow / maxRateY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw Processing Rate r(z) (Purple)
          ctx.beginPath();
          history.forEach((pt, i) => {
            const x = padding.left + (plotW / (history.length - 1)) * i;
            const y = padding.top + plotH * (1 - pt.processingRate / maxRateY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Draw Dropped Rate (Red)
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

        // Asymptote epsilon line
        const epsY = padding.top + plotH * (1 - state.server.epsilon / maxRateY);
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.moveTo(padding.left, epsY);
        ctx.lineTo(width - padding.right, epsY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#a855f7';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Capacidad Máx ε = ${state.server.epsilon} paq/s (${state.server.epsilonKBS} kB/s)`, width - padding.right, epsY - 4);

        // Y-axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(maxRateY)} paq/s`, padding.left - 8, padding.top + 8);
        ctx.fillText('0', padding.left - 8, height - padding.bottom + 3);

        // Title and Legend
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('Flujos de Tráfico: Entrada q(1), Servicio r(z) y Pérdida [paq/s & kB/s]', padding.left, 18);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText('— Entrada q(1)', padding.left + 320, 18);
        ctx.fillStyle = '#a855f7';
        ctx.fillText('— Salida r(z)', padding.left + 420, 18);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('— Descartes', padding.left + 510, 18);

      } else if (activeTab === 'saturation') {
        // TAB 3: Non-Linear Saturation Curve r(z) = \epsilon * z / (1 + z)
        const eps = state.server.epsilon;
        const maxZ = SERVER_MAX_BUFFER;
        const maxR = eps * 1.15;

        // Asymptote \epsilon line
        const epsY = padding.top + plotH * (1 - eps / maxR);
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(padding.left, epsY);
        ctx.lineTo(width - padding.right, epsY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Asíntota de Saturación ε = ${eps} paq/s (${state.server.epsilonKBS} kB/s)`, width - padding.right, epsY - 5);

        // Draw theoretical r(z) curve
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

        // Current Operating Point (z_current, r_current)
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

        // Label operating point
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Punto Actual: z=${currentZ.toFixed(1)} paq (${(currentZ * 0.119).toFixed(1)} kB), r=${currentR.toFixed(1)} paq/s`, curX + 10, curY - 5);

        // Axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${eps}`, padding.left - 8, epsY + 3);
        ctx.fillText('0', padding.left - 8, height - padding.bottom + 3);

        ctx.textAlign = 'center';
        ctx.fillText('0', padding.left, height - padding.bottom + 16);
        ctx.fillText(`Búfer z (máx ${maxZ})`, padding.left + plotW / 2, height - padding.bottom + 18);
        ctx.fillText(`${maxZ}`, width - padding.right, height - padding.bottom + 16);

        // Title
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('Función de Procesamiento No Lineal r(z) = ε·z / (1 + z)', padding.left, 18);

      } else if (activeTab === 'spatial') {
        // TAB 4: PDE Spatial Density Profile q(x) along x in [0, 1]
        const gw = state.gateways[0]; // Primary gateway
        if (gw && gw.spatialQ) {
          const maxQ = Math.max(40, ...state.gateways.flatMap((g) => g.spatialQ)) + 5;

          state.gateways.forEach((g, gIdx) => {
            const colors = ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e'];
            const color = colors[gIdx % colors.length];

            ctx.beginPath();
            g.spatialQ.forEach((val, m) => {
              const x = padding.left + (plotW / (SPATIAL_POINTS - 1)) * m;
              const y = padding.top + plotH * (1 - val / maxQ);
              if (m === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          // Axis markers for x = 0 (Gateway) and x = 1 (Server)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('x = 0 (Entrada Gateway)', padding.left, height - padding.bottom + 16);
          ctx.textAlign = 'right';
          ctx.fillText('x = 1 (Llegada Servidor)', width - padding.right, height - padding.bottom + 16);

          // Title and explanation
          ctx.textAlign = 'left';
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Perfil Espacial PDE q(x) [Transporte Advectivo: ∂t q + λ ∂x q = 0]`, padding.left, 18);
        }
      }

      ctx.restore();
    };

    render();
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, activeTab]);

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Chart Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-900/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('buffer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'buffer'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            📊 Dinámica del Búfer z(t) vs z*
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'rates'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ⚡ Flujos y Cuello de Botella
          </button>
          <button
            onClick={() => setActiveTab('saturation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'saturation'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            📈 Función r(z) y Límite ε
          </button>
          <button
            onClick={() => setActiveTab('spatial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'spatial'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🌊 Perfil Espacial PDE q(x)
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          {activeTab === 'buffer' && 'dz/dt = w·d + Σw·q(1) - r(z)'}
          {activeTab === 'rates' && 'r(z) = ε·z / (1 + z)'}
          {activeTab === 'saturation' && `ε = ${state.server.epsilon} paq/s`}
          {activeTab === 'spatial' && `∂q/∂t + ${state.lambda}·∂q/∂x = 0`}
        </div>
      </div>

      <div className="w-full h-52 relative">
        <canvas ref={chartCanvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}

'use client';

import React, { useRef, useEffect } from 'react';
import { SimulationState } from '@/lib/types';
import { SERVER_MAX_BUFFER, GATEWAY_MAX_BUFFER } from '@/lib/simulation-engine';

interface NetworkCanvasProps {
  state: SimulationState;
  onSelectGateway?: (index: number) => void;
  selectedGatewayIndex?: number;
}

export function NetworkCanvas({
  state,
  onSelectGateway,
  selectedGatewayIndex = 0,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

      // Deep clean background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, width, height);

      // Very subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const numGateways = state.gateways.length;

      // Balanced responsive layout coordinates
      const sensorCardW = 150;
      const sensorCardH = 40;
      const sensorX = 24; // left margin

      const gwW = 116;
      const gwH = 68;
      const gwX = Math.max(sensorX + sensorCardW + 40, width * 0.42);

      const serverW = 155;
      const serverH = 135;
      const serverX = width - serverW - 28;
      const serverY = height / 2;

      // Calculate vertical spacing
      const gwSpacing = height / (numGateways + 1);
      const gwPositions: { x: number; y: number }[] = [];
      const sensorPositions: { rainY: number; waterY: number }[] = [];

      for (let i = 0; i < numGateways; i++) {
        const gy = gwSpacing * (i + 1);
        gwPositions.push({ x: gwX, y: gy });

        const sensorOffset = Math.min(26, gwSpacing * 0.28);
        sensorPositions.push({
          rainY: gy - sensorOffset,
          waterY: gy + sensorOffset,
        });
      }

      // 1. DRAW PDE TRANSMISSION LINES (Gateway -> Central Server)
      gwPositions.forEach((gp, idx) => {
        const gw = state.gateways[idx];
        const isSelected = selectedGatewayIndex === idx;

        const startX = gp.x + gwW;
        const startY = gp.y;
        const endX = serverX;
        const endY = serverY;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
          startX + 80,
          startY,
          endX - 80,
          endY,
          endX,
          endY
        );

        // Density-based gradient
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        const q0 = gw.spatialQ[0] || 0;
        const qEnd = gw.spatialQ[gw.spatialQ.length - 1] || 0;
        const intensity = Math.min(1, (q0 + qEnd) / 50);

        if (state.mode === 'unoptimized' && state.server.isBottleneck) {
          grad.addColorStop(0, `rgba(239, 68, 68, ${0.45 + intensity * 0.45})`);
          grad.addColorStop(1, `rgba(220, 38, 38, ${0.7 + intensity * 0.3})`);
        } else {
          grad.addColorStop(0, `rgba(56, 189, 248, ${0.35 + intensity * 0.45})`);
          grad.addColorStop(1, `rgba(99, 102, 241, ${0.45 + intensity * 0.45})`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.stroke();

        // Sleek Line Badge positioned above curve
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 + (idx - (numGateways - 1) / 2) * 14;

        ctx.beginPath();
        ctx.roundRect(midX - 58, midY - 14, 116, 18, 5);
        ctx.fillStyle = 'rgba(9, 14, 26, 0.85)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.6)' : 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Línea ${idx + 1}: τ=${state.tau}s | 119B`, midX, midY - 2);
      });

      // 2. DRAW MOVING PACKET PARTICLES ALONG PDE LINES
      state.particles.forEach((p) => {
        const gp = gwPositions[p.gatewayIndex];
        if (!gp) return;

        const startX = gp.x + gwW;
        const startY = gp.y;
        const endX = serverX;
        const endY = serverY;

        const t = Math.max(0, Math.min(1, p.x));
        const p0x = startX;
        const p0y = startY;
        const p1x = startX + 80;
        const p1y = startY;
        const p2x = endX - 80;
        const p2y = endY;
        const p3x = endX;
        const p3y = endY;

        const cx =
          Math.pow(1 - t, 3) * p0x +
          3 * Math.pow(1 - t, 2) * t * p1x +
          3 * (1 - t) * Math.pow(t, 2) * p2x +
          Math.pow(t, 3) * p3x;
        const cy =
          Math.pow(1 - t, 3) * p0y +
          3 * Math.pow(1 - t, 2) * t * p1y +
          3 * (1 - t) * Math.pow(t, 2) * p2y +
          Math.pow(t, 3) * p3y;

        ctx.beginPath();
        ctx.arc(cx, cy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. DRAW SENSORS AND CONNECTIONS TO GATEWAY (Clean cards, NO overflowing globes!)
      gwPositions.forEach((gp, idx) => {
        const gw = state.gateways[idx];
        const sPos = sensorPositions[idx];

        // Connection line: Pluviómetro -> Gateway
        ctx.beginPath();
        ctx.moveTo(sensorX + sensorCardW, sPos.rainY);
        ctx.lineTo(gp.x, gp.y - 12);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Connection line: Sensor de Agua -> Gateway
        ctx.beginPath();
        ctx.moveTo(sensorX + sensorCardW, sPos.waterY);
        ctx.lineTo(gp.x, gp.y + 12);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- SENSOR 1: PLUVIÓMETRO CARD ---
        const rY = sPos.rainY - sensorCardH / 2;
        ctx.beginPath();
        ctx.roundRect(sensorX, rY, sensorCardW, sensorCardH, 7);
        ctx.fillStyle = '#0b1324';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Pluv icon circle
        ctx.beginPath();
        ctx.arc(sensorX + 16, rY + sensorCardH / 2, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌧️', sensorX + 16, rY + sensorCardH / 2 + 3);

        // Pluv text
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Pluviómetro', sensorX + 32, rY + 16);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText(`${gw.environment.rain_mm.toFixed(1)} mm · ~20B`, sensorX + 32, rY + 30);

        // --- SENSOR 2: SENSOR DE AGUA (Q y v) CARD ---
        const wY = sPos.waterY - sensorCardH / 2;
        ctx.beginPath();
        ctx.roundRect(sensorX, wY, sensorCardW, sensorCardH, 7);
        ctx.fillStyle = '#0b1324';
        ctx.fill();
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Water icon circle
        ctx.beginPath();
        ctx.arc(sensorX + 16, wY + sensorCardH / 2, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 184, 166, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌊', sensorX + 16, wY + sensorCardH / 2 + 3);

        // Water text
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Sensor de Agua', sensorX + 32, wY + 16);

        ctx.fillStyle = '#2dd4bf';
        ctx.font = '9.5px monospace';
        ctx.fillText(`Q:${gw.environment.waterFlow} · v:${gw.environment.waterSpeed.toFixed(1)} m/s`, sensorX + 32, wY + 30);

        // --- GATEWAY NODE CARD ---
        const isSelected = selectedGatewayIndex === idx;
        const gLeft = gp.x;
        const gTop = gp.y - gwH / 2;

        ctx.beginPath();
        ctx.roundRect(gLeft, gTop, gwW, gwH, 8);
        ctx.fillStyle = isSelected ? '#111d33' : '#0d1527';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(71, 85, 105, 0.6)';
        ctx.lineWidth = isSelected ? 2 : 1.2;
        ctx.stroke();

        if (isSelected) {
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Gateway title
        ctx.fillStyle = isSelected ? '#38bdf8' : '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Gateway ${idx + 1}`, gLeft + gwW / 2, gTop + 17);

        // Gateway Buffer progress bar
        const bufRatio = Math.min(1, gw.buffer / GATEWAY_MAX_BUFFER);
        const barW = gwW - 24;
        const barH = 6;
        const barX = gLeft + 12;
        const barY = gTop + 24;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barW, barH);

        let bufColor = '#10b981';
        if (bufRatio > 0.75) bufColor = '#ef4444';
        else if (bufRatio > 0.45) bufColor = '#f59e0b';

        ctx.fillStyle = bufColor;
        ctx.fillRect(barX, barY, barW * bufRatio, barH);

        // Gateway metrics
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`d=${gw.demand.toFixed(1)} paq/s`, gLeft + gwW / 2, gTop + 43);
        ctx.fillText(`w=${gw.w.toFixed(2)} | u=${gw.u.toFixed(2)}`, gLeft + gwW / 2, gTop + 57);
      });

      // 4. DRAW CENTRAL SERVER (Spacious, elegant box, NO overlapping text!)
      const isBottleneck = state.server.isBottleneck;
      const sLeft = serverX;
      const sTop = serverY - serverH / 2;

      ctx.beginPath();
      ctx.roundRect(sLeft, sTop, serverW, serverH, 10);
      ctx.fillStyle = isBottleneck ? '#2d0a0a' : '#0f172a';
      ctx.fill();
      ctx.strokeStyle = isBottleneck ? '#ef4444' : '#6366f1';
      ctx.lineWidth = isBottleneck ? 2.5 : 1.8;
      ctx.stroke();

      if (isBottleneck) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Server Header
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERVIDOR CENTRAL', sLeft + serverW / 2, sTop + 20);

      ctx.font = '9.5px monospace';
      ctx.fillStyle = '#a5b4fc';
      ctx.fillText(`ε = ${state.server.epsilon} paq/s (${state.server.epsilonKBS.toFixed(1)} kB/s)`, sLeft + serverW / 2, sTop + 33);

      // Buffer Bar in Server
      const sBufRatio = Math.min(1, state.server.buffer / SERVER_MAX_BUFFER);
      const sBarW = serverW - 28;
      const sBarH = 12;
      const sBarX = sLeft + 14;
      const sBarY = sTop + 42;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sBarX, sBarY, sBarW, sBarH);

      let sBufColor = '#10b981';
      if (sBufRatio > 0.85) sBufColor = '#ef4444';
      else if (sBufRatio > 0.5) sBufColor = '#f59e0b';

      ctx.fillStyle = sBufColor;
      ctx.fillRect(sBarX, sBarY, sBarW * sBufRatio, sBarH);

      // Theoretical equilibrium z* marker line
      if (state.server.isEquilibriumFinite) {
        const zRatio = Math.min(1, state.server.zEquilibrium / SERVER_MAX_BUFFER);
        const zMarkerX = sBarX + sBarW * zRatio;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(zMarkerX, sBarY - 2);
        ctx.lineTo(zMarkerX, sBarY + sBarH + 2);
        ctx.stroke();
      }

      // Server Internal Metrics
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.fillText(`Búfer z: ${state.server.buffer.toFixed(1)} paq (${state.server.bufferKB.toFixed(1)} kB)`, sLeft + serverW / 2, sTop + 70);
      ctx.fillText(`Salida r(z): ${state.server.processingRate.toFixed(1)} paq/s`, sLeft + serverW / 2, sTop + 84);
      ctx.fillText(`CPU: ${state.server.cpuUtilization.toFixed(0)}% · Latencia: ${state.server.queueDelay}ms`, sLeft + serverW / 2, sTop + 98);
      ctx.fillText(`Entrada: ${state.server.inflow.toFixed(1)} paq/s`, sLeft + serverW / 2, sTop + 112);

      // Dedicated Status Badge below server box (separated cleanly)
      const badgeY = sTop + serverH + 12;
      ctx.beginPath();
      ctx.roundRect(sLeft, badgeY, serverW, 26, 6);
      if (isBottleneck) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ CUELLO DE BOTELLA (${Math.floor(state.server.totalDropped)} paq)`, sLeft + serverW / 2, badgeY + 16);
      } else {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`ESTABLE (z*=${state.server.zEquilibrium.toFixed(1)} paq)`, sLeft + serverW / 2, badgeY + 16);
      }

      ctx.restore();
    };

    render();
    const animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, selectedGatewayIndex]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSelectGateway) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const numGateways = state.gateways.length;
    const gwW = 116;
    const gwH = 68;
    const gwX = Math.max(150 + 40, rect.width * 0.42);
    const gwSpacing = rect.height / (numGateways + 1);

    for (let i = 0; i < numGateways; i++) {
      const gy = gwSpacing * (i + 1);
      if (x >= gwX && x <= gwX + gwW && y >= gy - gwH / 2 && y <= gy + gwH / 2) {
        onSelectGateway(i);
        break;
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-95 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Left Title Badge */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-200">Topología de Red PDE–ODE</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">
          Modo: <strong className={state.mode === 'optimized' ? 'text-emerald-400' : 'text-rose-400'}>{state.mode === 'optimized' ? 'Optimizado (ISS)' : 'No Optimizado (FIFO)'}</strong>
        </span>
      </div>

      {/* Top Right Legend Badge */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Pluviómetro (~20B)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> Sensor Agua Q/v (~20B)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-indigo-400"></span> Línea PDE (JSON ~119B)
        </span>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full flex-1 cursor-pointer block"
      />

      {/* Bottom Sub-bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>Consolidación Gateway: <strong>20B (Pluv) + 20B (Agua) → 119B JSON</strong> (-25% peaje) | Escala Bytes / kB (<strong>jamás 1 MB</strong>)</span>
        </div>
        <div className="font-mono text-slate-300">
          Retardo PDE: τ = 1/λ = <strong>{state.tau}s</strong> | Capacidad Servidor ε = <strong>{state.server.epsilon} paq/s ({state.server.epsilonKBS} kB/s)</strong>
        </div>
      </div>
    </div>
  );
}

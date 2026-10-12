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

    let animationFrameId: number;

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

      // Background grid
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 32;
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
      const serverX = width - 150;
      const serverY = height / 2;
      const gwX = width * 0.44;
      const sensorX = 80;

      // Draw Gateways & Sensors
      const gwPositions: { x: number; y: number }[] = [];
      const sensorYPositions: { speedY: number; tempY: number }[] = [];

      const gwSpacing = height / (numGateways + 1);

      for (let i = 0; i < numGateways; i++) {
        const gy = gwSpacing * (i + 1);
        gwPositions.push({ x: gwX, y: gy });

        const sensorOffset = Math.min(26, gwSpacing * 0.28);
        sensorYPositions.push({
          speedY: gy - sensorOffset,
          tempY: gy + sensorOffset,
        });
      }

      // Draw Transmission Lines (PDE links) from Gateways to Server
      gwPositions.forEach((gp, idx) => {
        const gw = state.gateways[idx];
        const isSelected = selectedGatewayIndex === idx;

        // Path between gateway and server
        ctx.beginPath();
        ctx.moveTo(gp.x + 35, gp.y);
        ctx.bezierCurveTo(
          gp.x + 100,
          gp.y,
          serverX - 100,
          serverY,
          serverX - 35,
          serverY
        );

        // Gradient based on spatial PDE density q(t, x)
        const grad = ctx.createLinearGradient(gp.x + 35, gp.y, serverX - 35, serverY);
        const q0 = gw.spatialQ[0] || 0;
        const qEnd = gw.spatialQ[gw.spatialQ.length - 1] || 0;
        const intensity = Math.min(1, (q0 + qEnd) / 60);

        if (state.mode === 'unoptimized' && state.server.isBottleneck) {
          grad.addColorStop(0, `rgba(239, 68, 68, ${0.4 + intensity * 0.5})`);
          grad.addColorStop(1, `rgba(220, 38, 38, ${0.7 + intensity * 0.3})`);
        } else {
          grad.addColorStop(0, `rgba(56, 189, 248, ${0.3 + intensity * 0.5})`);
          grad.addColorStop(1, `rgba(99, 102, 241, ${0.4 + intensity * 0.5})`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.stroke();

        // Label line PDE parameters
        const midX = (gp.x + 35 + serverX - 35) / 2;
        const midY = (gp.y + serverY) / 2 + (idx - (numGateways - 1) / 2) * 12;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Línea ${idx + 1}: λ=${state.lambda} (τ=${state.tau}s) | q(1)=${qEnd.toFixed(1)}`, midX, midY - 6);
      });

      // Draw moving packet particles along PDE lines
      state.particles.forEach((p) => {
        const gp = gwPositions[p.gatewayIndex];
        if (!gp) return;

        // Parametric bezier point for x in [0, 1]
        const t = Math.max(0, Math.min(1, p.x));
        const p0x = gp.x + 35;
        const p0y = gp.y;
        const p1x = gp.x + 100;
        const p1y = gp.y;
        const p2x = serverX - 100;
        const p2y = serverY;
        const p3x = serverX - 35;
        const p3y = serverY;

        // Cubic Bezier formulation
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
        if (p.type === 'speed') {
          ctx.fillStyle = '#38bdf8'; // sky blue for water velocity
          ctx.shadowColor = '#0284c7';
        } else {
          ctx.fillStyle = '#fbbf24'; // amber for water temperature
          ctx.shadowColor = '#d97706';
        }
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Sensor nodes and connections to Gateways
      gwPositions.forEach((gp, idx) => {
        const gw = state.gateways[idx];
        const sY = sensorYPositions[idx];

        // Line from Speed sensor to GW
        ctx.beginPath();
        ctx.moveTo(sensorX + 26, sY.speedY);
        ctx.lineTo(gp.x - 35, gp.y - 8);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Line from Temp sensor to GW
        ctx.beginPath();
        ctx.moveTo(sensorX + 26, sY.tempY);
        ctx.lineTo(gp.x - 35, gp.y + 8);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Draw Speed Sensor Node
        ctx.beginPath();
        ctx.arc(sensorX, sY.speedY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#0369a1';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Speed icon / text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌊 Vel', sensorX, sY.speedY - 3);
        ctx.font = '8px monospace';
        ctx.fillText(`${gw.sensors.speedSensor.waterSpeed}m/s`, sensorX, sY.speedY + 8);

        // Draw Temperature Sensor Node
        ctx.beginPath();
        ctx.arc(sensorX, sY.tempY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#b45309';
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Temp icon / text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('🌡️ Temp', sensorX, sY.tempY - 3);
        ctx.font = '8px monospace';
        ctx.fillText(`${gw.sensors.tempSensor.waterTemp}°C`, sensorX, sY.tempY + 8);

        // Gateway Node Box
        const isSelected = selectedGatewayIndex === idx;
        ctx.beginPath();
        ctx.roundRect(gp.x - 40, gp.y - 28, 80, 56, 8);
        ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#475569';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Gateway title & Demand
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Gateway ${idx + 1}`, gp.x, gp.y - 12);

        // Gateway Buffer mini bar
        const bufRatio = Math.min(1, gw.buffer / GATEWAY_MAX_BUFFER);
        const barW = 60;
        const barH = 7;
        const barX = gp.x - barW / 2;
        const barY = gp.y + 4;

        ctx.fillStyle = '#334155';
        ctx.fillRect(barX, barY, barW, barH);

        let bufColor = '#10b981'; // green
        if (bufRatio > 0.75) bufColor = '#ef4444'; // red
        else if (bufRatio > 0.45) bufColor = '#f59e0b'; // orange

        ctx.fillStyle = bufColor;
        ctx.fillRect(barX, barY, barW * bufRatio, barH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '8px monospace';
        ctx.fillText(`d=${gw.demand.toFixed(0)} | w=${gw.w.toFixed(2)}`, gp.x, gp.y + 22);
      });

      // Draw Central Server
      const isBottleneck = state.server.isBottleneck;
      const isUnoptimized = state.mode === 'unoptimized';

      ctx.beginPath();
      ctx.roundRect(serverX - 45, serverY - 55, 90, 110, 10);
      ctx.fillStyle = isBottleneck ? '#450a0a' : '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = isBottleneck ? '#ef4444' : '#818cf8';
      ctx.lineWidth = isBottleneck ? 3 : 2;
      ctx.stroke();

      // Pulsing glow if bottleneck
      if (isBottleneck) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Server Header
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERVIDOR', serverX, serverY - 36);
      ctx.fillText('CENTRAL', serverX, serverY - 24);

      // Buffer Bar in Central Server
      const sBufRatio = Math.min(1, state.server.buffer / SERVER_MAX_BUFFER);
      const sBarW = 70;
      const sBarH = 14;
      const sBarX = serverX - sBarW / 2;
      const sBarY = serverY - 8;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sBarX, sBarY, sBarW, sBarH);

      let sBufColor = '#10b981';
      if (sBufRatio > 0.85) sBufColor = '#ef4444';
      else if (sBufRatio > 0.5) sBufColor = '#f59e0b';

      ctx.fillStyle = sBufColor;
      ctx.fillRect(sBarX, sBarY, sBarW * sBufRatio, sBarH);

      // Equilibrium z* marker on server buffer bar
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

      // Server metrics
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '9px monospace';
      ctx.fillText(`z=${state.server.buffer.toFixed(1)} / ${SERVER_MAX_BUFFER}`, serverX, sBarY + 23);
      ctx.fillText(`r(z)=${state.server.processingRate.toFixed(1)} / ε=${state.server.epsilon}`, serverX, sBarY + 34);
      ctx.fillText(`CPU: ${state.server.cpuUtilization}%`, serverX, sBarY + 45);

      // Discarded Packets Falling Effect if Overflow
      if (isUnoptimized && state.server.isBottleneck) {
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('⚠️ CUELLO DE BOTELLA', serverX, serverY + 70);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`Descartes: ${Math.floor(state.server.totalDropped)} paq`, serverX, serverY + 84);

        // Animated drop particles falling downward
        const tDrop = (Date.now() / 250) % 1;
        ctx.beginPath();
        ctx.arc(serverX, serverY + 55 + tDrop * 35, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      } else if (state.mode === 'optimized') {
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('✅ ESTABILIZADO ISS', serverX, serverY + 70);
        ctx.font = '9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`z* eq: ${state.server.zEquilibrium.toFixed(1)}`, serverX, serverY + 83);
      }

      ctx.restore();
    };

    render();
    animationFrameId = requestAnimationFrame(render);

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
    const gwX = rect.width * 0.44;
    const gwSpacing = rect.height / (numGateways + 1);

    for (let i = 0; i < numGateways; i++) {
      const gy = gwSpacing * (i + 1);
      if (Math.hypot(x - gwX, y - gy) < 40) {
        onSelectGateway(i);
        break;
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-200">Topología PDE-ODE en Tiempo Real</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">
          Modo: <strong className={state.mode === 'optimized' ? 'text-emerald-400' : 'text-rose-400'}>{state.mode === 'optimized' ? 'Optimizado (ISS)' : 'No Optimizado (FIFO)'}</strong>
        </span>
      </div>

      <div className="absolute top-3 right-4 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Sensor Caudal/Vel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Sensor Temp
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-indigo-400"></span> Línea PDE
        </span>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full flex-1 cursor-pointer block"
      />

      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>Click en un <strong>Gateway</strong> para sintonizar sus sensores ambientales.</span>
        </div>
        <div className="font-mono text-slate-300">
          Retardo PDE: τ = 1/λ = <strong>{state.tau}s</strong> | Capacidad Servidor ε = <strong>{state.server.epsilon} paq/s</strong>
        </div>
      </div>
    </div>
  );
}

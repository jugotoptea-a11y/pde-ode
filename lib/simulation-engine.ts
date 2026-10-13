import {
  EnvironmentalState,
  GatewayNodeState,
  SimulationMode,
  SimulationState,
  WeatherPreset,
} from './types';

// Constants for IoT Packet Weights based on real telemetry specifications:
export const LOCAL_RAIN_SENSOR_BYTES = 20;  // ~20 B local raw reading (Pluviómetro)
export const LOCAL_WATER_SENSOR_BYTES = 20; // ~20 B local raw reading (Sensor de Agua: Caudal y Velocidad acoplados)
export const UNIFIED_PACKET_BYTES = 119;    // ~119 B JSON consolidated payload + IP/UDP headers
export const SEPARATE_TX_BYTES = 158;       // ~158 B when sensors send individually with separate headers
export const BANDWIDTH_SAVING_PERCENT = 24.7; // ~25% bandwidth saved by gateway consolidation

export const SPATIAL_POINTS = 30; // Grid points along PDE line x in [0, 1]
export const DEFAULT_LAMBDA = 1.8; // Effective propagation speed
export const SERVER_MAX_BUFFER = 120; // Maximum physical buffer size in packets (~14.28 kB)
export const GATEWAY_MAX_BUFFER = 80; // Maximum gateway buffer in packets (~9.52 kB)

// 60 Empirical Pairs (Caudal Q in m³/s, Velocidad v in m/s) provided by the user
export interface FlowVelocityPair {
  flow: number;  // m³/s
  speed: number; // m/s
}

// Exactly the 60 pairs provided, sorted by Caudal ascending to enable continuous hydraulic progression
export const EMPIRICAL_FLOW_SPEED_PAIRS: FlowVelocityPair[] = [
  { flow: 12, speed: 3.7 },
  { flow: 16, speed: 4.1 },
  { flow: 17, speed: 4.2 },
  { flow: 19, speed: 4.4 },
  { flow: 22, speed: 4.7 },
  { flow: 23, speed: 5.0 },
  { flow: 26, speed: 4.9 },
  { flow: 27, speed: 4.7 },
  { flow: 27, speed: 5.1 },
  { flow: 29, speed: 5.2 },
  { flow: 33, speed: 5.4 },
  { flow: 34, speed: 5.5 },
  { flow: 35, speed: 5.5 },
  { flow: 37, speed: 5.7 },
  { flow: 37, speed: 5.7 },
  { flow: 42, speed: 6.0 },
  { flow: 44, speed: 6.0 },
  { flow: 45, speed: 6.1 },
  { flow: 46, speed: 6.1 },
  { flow: 46, speed: 6.1 },
  { flow: 47, speed: 6.6 },
  { flow: 52, speed: 6.4 },
  { flow: 54, speed: 6.5 },
  { flow: 56, speed: 6.2 },
  { flow: 58, speed: 6.7 },
  { flow: 59, speed: 6.7 },
  { flow: 60, speed: 6.8 },
  { flow: 61, speed: 7.2 },
  { flow: 62, speed: 6.8 },
  { flow: 64, speed: 6.9 },
  { flow: 67, speed: 7.0 },
  { flow: 68, speed: 7.1 },
  { flow: 72, speed: 6.8 },
  { flow: 73, speed: 7.2 },
  { flow: 74, speed: 7.3 },
  { flow: 76, speed: 7.4 },
  { flow: 78, speed: 7.9 },
  { flow: 80, speed: 7.9 },
  { flow: 83, speed: 7.6 },
  { flow: 84, speed: 7.6 },
  { flow: 86, speed: 7.7 },
  { flow: 87, speed: 7.7 },
  { flow: 87, speed: 7.7 },
  { flow: 92, speed: 7.4 },
  { flow: 94, speed: 7.5 },
  { flow: 99, speed: 8.1 },
  { flow: 100, speed: 8.1 },
  { flow: 110, speed: 8.4 },
  { flow: 112, speed: 8.4 },
  { flow: 113, speed: 8.4 },
  { flow: 113, speed: 8.5 },
  { flow: 114, speed: 8.5 },
  { flow: 127, speed: 8.8 },
  { flow: 129, speed: 8.9 },
  { flow: 132, speed: 8.9 },
  { flow: 144, speed: 9.2 },
  { flow: 147, speed: 9.3 },
  { flow: 159, speed: 9.5 },
  { flow: 183, speed: 9.9 },
  { flow: 208, speed: 10.4 },
];

export function getFlowVelocityPair(index: number): FlowVelocityPair {
  const safeIdx = Math.max(0, Math.min(EMPIRICAL_FLOW_SPEED_PAIRS.length - 1, Math.round(index)));
  return EMPIRICAL_FLOW_SPEED_PAIRS[safeIdx];
}


export const DEFAULT_GATEWAY_LOCATIONS = [
  { name: 'Gateway 1', location: 'Canal Primario - Estación de Telemetría 1' },
  { name: 'Gateway 2', location: 'Canal Secundario - Estación de Telemetría 2' },
  { name: 'Gateway 3', location: 'Colector Auxiliar - Estación de Telemetría 3' },
  { name: 'Gateway 4', location: 'Colector de Alivio - Estación de Telemetría 4' },
];

/**
 * Creates environmental state from preset
 * Historical reference rainfall range: 0.8 mm (dry) to 160.5 mm (max recorded), up to 180 mm.
 */
export function createInitialEnvironmentalState(preset: WeatherPreset = 'dry'): EnvironmentalState {
  switch (preset) {
    case 'dry': {
      const pair = getFlowVelocityPair(0); // 12 m³/s, 3.7 m/s
      return { rain_mm: 0.8, flowIndex: 0, waterFlow: pair.flow, waterSpeed: pair.speed };
    }
    case 'moderate': {
      const pair = getFlowVelocityPair(22); // 54 m³/s, 6.5 m/s
      return { rain_mm: 38.0, flowIndex: 22, waterFlow: pair.flow, waterSpeed: pair.speed };
    }
    case 'torrential': {
      const pair = getFlowVelocityPair(44); // 94 m³/s, 7.5 m/s
      return { rain_mm: 93.7, flowIndex: 44, waterFlow: pair.flow, waterSpeed: pair.speed };
    }
    case 'extreme_flood': {
      const pair = getFlowVelocityPair(59); // 208 m³/s, 10.4 m/s
      return { rain_mm: 160.5, flowIndex: 59, waterFlow: pair.flow, waterSpeed: pair.speed };
    }
    default: {
      const pair = getFlowVelocityPair(0);
      return { rain_mm: 1.0, flowIndex: 0, waterFlow: pair.flow, waterSpeed: pair.speed };
    }
  }
}

/**
 * Computes telemetry rates for Pluviómetro (rain) and Water Sensor (coupled Q and v)
 */
export function computeSensorTelemetry(env: EnvironmentalState) {
  const rain = Math.max(0, env.rain_mm);
  const pair = getFlowVelocityPair(env.flowIndex);
  const flow = pair.flow;
  const speed = pair.speed;

  // 1. Pluviómetro rate: Base telemetry 3.0 paq/s + scale proportional to rainfall mm
  const rainRate = 3.0 + 0.28 * rain;

  // 2. Water Sensor rate: Base 3.5 paq/s + scaled by flow and speed
  const waterRate = 3.5 + 0.18 * flow + 2.2 * Math.max(0, speed - 3.5);

  // Total packet demand in paq/s
  const totalDemand = Number((rainRate + waterRate).toFixed(1));

  // In kB/s (each unified packet is 119 Bytes = 0.119 kB)
  const demandKBS = Number(((totalDemand * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  return {
    rainSensor: {
      name: 'Pluviómetro',
      reading: `${rain.toFixed(1)} mm`,
      generationRate: Number(rainRate.toFixed(1)),
      bytesRate: Number(((rainRate * LOCAL_RAIN_SENSOR_BYTES) / 1000).toFixed(2)),
      rawBytes: LOCAL_RAIN_SENSOR_BYTES,
    },
    waterSensor: {
      name: 'Sensor de Agua (Q y v)',
      reading: `Q=${flow} m³/s, v=${speed.toFixed(1)} m/s`,
      generationRate: Number(waterRate.toFixed(1)),
      bytesRate: Number(((waterRate * LOCAL_WATER_SENSOR_BYTES) / 1000).toFixed(2)),
      rawBytes: LOCAL_WATER_SENSOR_BYTES,
    },
    waterFlow: flow,
    waterSpeed: speed,
    totalDemand,
    demandKBS,
  };
}

export function createInitialState(numGateways: number = 3, mode: SimulationMode = 'optimized'): SimulationState {
  const lambda = DEFAULT_LAMBDA;
  const tau = Number((1 / lambda).toFixed(3));
  const serverEpsilon = 60; // Default central server capacity in paq/s (60 * 119 B = ~7.14 kB/s)

  const gateways: GatewayNodeState[] = [];
  for (let i = 0; i < numGateways; i++) {
    const loc = DEFAULT_GATEWAY_LOCATIONS[i] || {
      name: `Gateway ${i + 1}`,
      location: `Estación Auxiliar ${i + 1}`,
    };
    const env = createInitialEnvironmentalState('dry');
    const telemetry = computeSensorTelemetry(env);

    gateways.push({
      id: `gw-${i + 1}`,
      name: loc.name,
      location: loc.location,
      environment: env,
      sensors: {
        rainSensor: telemetry.rainSensor,
        waterSensor: telemetry.waterSensor,
      },
      buffer: 4.0, // in packets (~0.48 kB)
      bufferCapacity: GATEWAY_MAX_BUFFER,
      epsilon: 50.0,
      w: 1.0,
      u: 1.0,
      demand: telemetry.totalDemand,
      demandKBS: telemetry.demandKBS,
      outflow: 0.0,
      spatialQ: new Array(SPATIAL_POINTS).fill(telemetry.totalDemand / numGateways),
      droppedPackets: 0,
      admittedPackets: 0,
      bandwidthSavedKB: 0,
    });
  }

  const serverEpsKBS = Number(((serverEpsilon * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  return {
    time: 0,
    mode,
    numGateways,
    lambda,
    tau,
    serverEpsilon,
    gateways,
    server: {
      buffer: 6.0,
      bufferKB: Number(((6.0 * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      bufferCapacity: SERVER_MAX_BUFFER,
      epsilon: serverEpsilon,
      epsilonKBS: serverEpsKBS,
      w: 1.0,
      inflow: 0,
      inflowKBS: 0,
      processingRate: 0,
      processingRateKBS: 0,
      zEquilibrium: 0,
      isEquilibriumFinite: true,
      totalAdmitted: 0,
      totalProcessed: 0,
      totalDropped: 0,
      totalDroppedKB: 0,
      isBottleneck: false,
      cpuUtilization: 0,
      queueDelay: 0,
      totalBandwidthSavingsPercent: BANDWIDTH_SAVING_PERCENT,
    },
    particles: [],
    history: [],
  };
}

/**
 * Non-linear processing rate function as derived in the documents:
 * r_i(z_i) = \frac{\epsilon_i \cdot z_i}{1 + z_i} [paq/s]
 */
export function nonlinearProcessingRate(z: number, epsilon: number): number {
  if (z <= 0) return 0;
  return (epsilon * z) / (1 + z);
}

/**
 * Algebraic equilibrium calculation from document section 9:
 * z^* = \frac{w \cdot d}{(1 - w \cdot u)\epsilon - w \cdot d} [paq]
 * Valid when w \cdot d < (1 - w \cdot u)\epsilon
 */
export function calculateEquilibrium(
  w: number,
  u: number,
  d: number,
  epsilon: number
): { zStar: number; isStable: number; maxAdmissibleDemand: number } {
  const denominator = (1 - w * u) * epsilon - w * d;
  const maxAdmissibleDemand = (1 - w * u) * epsilon;

  if (denominator <= 0.001) {
    return {
      zStar: Infinity,
      isStable: 0,
      maxAdmissibleDemand,
    };
  }

  const zStar = (w * d) / denominator;
  return {
    zStar: Math.max(0, Number(zStar.toFixed(2))),
    isStable: 1,
    maxAdmissibleDemand,
  };
}

/**
 * Steps the simulation forward by dt (in seconds).
 */
export function stepSimulation(currentState: SimulationState, dt: number): SimulationState {
  const state: SimulationState = JSON.parse(JSON.stringify(currentState));
  state.time += dt;

  const mode = state.mode;
  const epsilonServ = state.serverEpsilon;
  const lambda = state.lambda;
  const dx = 1.0 / (SPATIAL_POINTS - 1);
  const cfl = (lambda * dt) / dx; // Courant-Friedrichs-Lewy condition

  // 1. Update Sensor Demands for each gateway
  let totalRawDemand = 0;
  state.gateways.forEach((gw) => {
    const telemetry = computeSensorTelemetry(gw.environment);
    gw.sensors = {
      rainSensor: telemetry.rainSensor,
      waterSensor: telemetry.waterSensor,
    };
    gw.environment.waterFlow = telemetry.waterFlow;
    gw.environment.waterSpeed = telemetry.waterSpeed;
    
    // In unoptimized mode (if sensors don't consolidate through gateway),
    // they send separate packets with ~25% extra overhead (158 B vs 119 B)!
    const effectiveDemand = mode === 'unoptimized' 
      ? Number((telemetry.totalDemand * (SEPARATE_TX_BYTES / UNIFIED_PACKET_BYTES)).toFixed(1))
      : telemetry.totalDemand;

    gw.demand = effectiveDemand;
    gw.demandKBS = Number(((effectiveDemand * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
    totalRawDemand += gw.demand;

    // Track bandwidth saved in optimized mode (kB saved)
    if (mode === 'optimized') {
      const savedBytesPerSec = telemetry.totalDemand * (SEPARATE_TX_BYTES - UNIFIED_PACKET_BYTES);
      gw.bandwidthSavedKB += (savedBytesPerSec * dt) / 1000;
    }
  });

  // 2. Control Laws (Optimized vs Unoptimized)
  let effectiveServerW = 1.0;
  if (mode === 'optimized') {
    const targetBuffer = SERVER_MAX_BUFFER * 0.35;
    const currentBuf = state.server.buffer;

    // ISS Closed-loop admission factor
    const capacityHeadroom = Math.max(0.05, 1.0 - currentBuf / targetBuffer);
    const flowRatio = (epsilonServ * 0.92) / Math.max(0.1, totalRawDemand);
    const optimalW = Math.min(1.0, Math.max(0.12, flowRatio * Math.min(1.0, capacityHeadroom + 0.4)));

    state.gateways.forEach((gw) => {
      gw.w = Number(optimalW.toFixed(3));
      gw.u = Number((1.0 / state.gateways.length).toFixed(3));
    });
    effectiveServerW = 1.0;
  } else {
    // Unoptimized mode: w = 1.0, u = 1.0 (blind admission, no throttling)
    state.gateways.forEach((gw) => {
      gw.w = 1.0;
      gw.u = 1.0;
    });
    effectiveServerW = 1.0;
  }

  // 3. Step Gateway Buffers (ODE) and solve PDE Boundary Condition
  let totalArrivalAtServer = 0;

  state.gateways.forEach((gw, gIdx) => {
    const admittedDemand = gw.w * gw.demand;
    const nonAdmitted = gw.demand - admittedDemand;

    if (mode === 'unoptimized' && gw.buffer >= gw.bufferCapacity) {
      gw.droppedPackets += nonAdmitted * dt;
    }
    gw.admittedPackets += admittedDemand * dt;

    // Gateway processing rate r_k(z_k)
    const gwProcessing = nonlinearProcessingRate(gw.buffer, gw.epsilon);
    gw.outflow = gwProcessing;

    // ODE: dz_k/dt = w_k * d_k - r_k(z_k)
    const dz_k = (admittedDemand - gwProcessing) * dt;
    gw.buffer = Math.max(0.01, gw.buffer + dz_k);

    // Overflow check on gateway
    if (gw.buffer > gw.bufferCapacity) {
      const overflow = gw.buffer - gw.bufferCapacity;
      gw.buffer = gw.bufferCapacity;
      if (mode === 'unoptimized') {
        gw.droppedPackets += overflow;
      }
    }

    // Boundary condition for PDE: q_k(t, 0) = u_k * r_k(z_k)
    const q_boundary = gw.u * gwProcessing;

    // Upwind numerical scheme for PDE: \partial_t q + \lambda \partial_x q = 0
    const oldQ = [...gw.spatialQ];
    const newQ = new Array(SPATIAL_POINTS).fill(0);
    newQ[0] = q_boundary;

    for (let m = 1; m < SPATIAL_POINTS; m++) {
      const advectionFlux = cfl * (oldQ[m] - oldQ[m - 1]);
      newQ[m] = Math.max(0, oldQ[m] - advectionFlux);
    }

    gw.spatialQ = newQ;

    // Value at x = 1 arrives at central server
    const arrivalFromThisLine = newQ[SPATIAL_POINTS - 1];
    totalArrivalAtServer += arrivalFromThisLine;

    // Particle animation generation (visual representation of unified 119 B packets)
    if (Math.random() < Math.min(0.65, arrivalFromThisLine * 0.04)) {
      state.particles.push({
        id: Math.random(),
        gatewayIndex: gIdx,
        x: 0,
        type: 'unified',
        size: Math.max(3, Math.min(6, 3 + (arrivalFromThisLine / 40) * 2)),
      });
    }
  });

  // 4. Central Server ODE Step: dz_serv/dt = w_serv \sum q_ki(t, 1) - r_serv(z_serv)
  state.server.inflow = Number(totalArrivalAtServer.toFixed(1));
  state.server.inflowKBS = Number(((totalArrivalAtServer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
  const admittedToServer = effectiveServerW * totalArrivalAtServer;

  // Server non-linear processing rate
  const rServer = nonlinearProcessingRate(state.server.buffer, epsilonServ);
  state.server.processingRate = Number(rServer.toFixed(1));
  state.server.processingRateKBS = Number(((rServer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
  state.server.cpuUtilization = Math.min(100, Number(((rServer / epsilonServ) * 100).toFixed(1)));
  state.server.epsilonKBS = Number(((epsilonServ * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  // Balance ODE:
  const dz_serv = (admittedToServer - rServer) * dt;
  state.server.buffer = Math.max(0.01, state.server.buffer + dz_serv);
  state.server.bufferKB = Number(((state.server.buffer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  // Buffer Overflow / Bottleneck logic
  const isOverflow = state.server.buffer >= state.server.bufferCapacity;
  let droppedThisStep = 0;

  if (isOverflow) {
    droppedThisStep = (state.server.buffer - state.server.bufferCapacity);
    state.server.buffer = state.server.bufferCapacity;
    state.server.bufferKB = Number(((SERVER_MAX_BUFFER * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
    state.server.totalDropped += droppedThisStep;
    state.server.totalDroppedKB = Number(((state.server.totalDropped * UNIFIED_PACKET_BYTES) / 1000).toFixed(1));
    state.server.isBottleneck = true;
  } else {
    state.server.isBottleneck = state.server.buffer > state.server.bufferCapacity * 0.8 && admittedToServer > rServer;
  }

  state.server.totalAdmitted += admittedToServer * dt;
  state.server.totalProcessed += rServer * dt;

  // Theoretical equilibrium in packets
  const avgW = state.gateways.reduce((acc, g) => acc + g.w, 0) / state.gateways.length;
  const avgU = state.gateways.reduce((acc, g) => acc + g.u, 0) / state.gateways.length;
  const eq = calculateEquilibrium(avgW, avgU, totalArrivalAtServer, epsilonServ);
  state.server.zEquilibrium = eq.zStar;
  state.server.isEquilibriumFinite = eq.isStable === 1;

  // Queue latency estimation (Little's law approximation: L = z / r)
  state.server.queueDelay = Number(((state.server.buffer / Math.max(0.5, rServer)) * 100).toFixed(0));

  // 5. Update Packet Particles along PDE lines
  state.particles = state.particles
    .map((p) => ({
      ...p,
      x: p.x + lambda * dt * 0.45,
    }))
    .filter((p) => p.x <= 1.0);

  // 6. Record History for Graphs
  if (state.history.length === 0 || state.time - state.history[state.history.length - 1].time >= 0.25) {
    state.history.push({
      time: Number(state.time.toFixed(1)),
      buffer: Number(state.server.buffer.toFixed(1)),
      bufferKB: Number(((state.server.buffer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      zEquilibrium: Number.isFinite(eq.zStar) ? Number(eq.zStar.toFixed(1)) : SERVER_MAX_BUFFER * 1.2,
      inflow: Number(totalArrivalAtServer.toFixed(1)),
      inflowKBS: Number(((totalArrivalAtServer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      processingRate: Number(rServer.toFixed(1)),
      processingRateKBS: Number(((rServer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      droppedRate: Number((droppedThisStep / dt).toFixed(1)),
      totalDemand: Number(totalRawDemand.toFixed(1)),
      isBottleneck: state.server.isBottleneck,
    });

    if (state.history.length > 70) {
      state.history.shift();
    }
  }

  return state;
}

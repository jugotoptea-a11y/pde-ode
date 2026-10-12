import {
  EnvironmentalState,
  GatewayNodeState,
  CentralServerState,
  PacketParticle,
  SimulationMode,
  SimulationState,
  WeatherPreset,
} from './types';

// Constants for IoT Packet Weights based on real telemetry specifications:
export const LOCAL_SPEED_SENSOR_BYTES = 20; // ~20 B local raw reading
export const LOCAL_TEMP_SENSOR_BYTES = 20;  // ~20 B local raw reading
export const UNIFIED_PACKET_BYTES = 119;    // ~119 B JSON consolidated payload + IP/UDP headers
export const SEPARATE_TX_BYTES = 158;       // ~158 B when sensors send individually with separate headers
export const BANDWIDTH_SAVING_PERCENT = 24.7; // ~25% bandwidth saved by gateway consolidation

export const SPATIAL_POINTS = 30; // Grid points along PDE line x in [0, 1]
export const DEFAULT_LAMBDA = 1.8; // Effective propagation speed
export const SERVER_MAX_BUFFER = 120; // Maximum physical buffer size in packets (~14.28 kB)
export const GATEWAY_MAX_BUFFER = 80; // Maximum gateway buffer in packets (~9.52 kB)

export const DEFAULT_GATEWAY_LOCATIONS = [
  { name: 'Gateway 1 (Arroyo La 84)', location: 'Sector Norte - Cra 53 con Cll 84' },
  { name: 'Gateway 2 (Arroyo Calle 76)', location: 'Sector Centro-Norte - Cll 76 con Cra 44' },
  { name: 'Gateway 3 (Arroyo Felicidad)', location: 'Sector Suroccidente - Cll 48 con Cra 43' },
  { name: 'Gateway 4 (Arroyo Hospital)', location: 'Sector Oriental - Vía 40 con Cll 34' },
];

export function createInitialEnvironmentalState(preset: WeatherPreset = 'dry'): EnvironmentalState {
  switch (preset) {
    case 'dry':
      return { rainIntensity: 5, waterSpeed: 0.8, waterTemp: 27.5 };
    case 'moderate':
      return { rainIntensity: 45, waterSpeed: 3.2, waterTemp: 26.0 };
    case 'torrential':
      return { rainIntensity: 110, waterSpeed: 7.5, waterTemp: 24.2 };
    case 'extreme_flood':
      return { rainIntensity: 165, waterSpeed: 10.8, waterTemp: 23.5 };
    default:
      return { rainIntensity: 10, waterSpeed: 1.0, waterTemp: 27.0 };
  }
}

export function computeSensorTelemetry(env: EnvironmentalState) {
  // Speed and water flow calculation
  const speed = Math.max(0.2, env.waterSpeed);
  // Cross section model approx for urban stream in Barranquilla: A(h) ~ 2.5 + (rain / 180) * 8.0
  const crossSection = 2.5 + (env.rainIntensity / 180) * 8.0;
  const flow = Number((speed * crossSection).toFixed(2));
  const temp = Number(env.waterTemp.toFixed(1));

  // Traffic demand generation formula (sampling frequency increases during severe rain/flood):
  // Speed sensor generates more samples under turbulent water flow
  const speedRate = 4.0 + 0.35 * env.rainIntensity + 4.2 * (speed - 0.2);
  const tempRate = 2.5 + 0.12 * Math.abs(temp - 26) + 0.08 * env.rainIntensity;
  
  // Total packets per second generated
  const totalDemand = Number((speedRate + tempRate).toFixed(1));
  // Total data rate in kB/s (each unified packet is 119 Bytes = 0.119 kB)
  const demandKBS = Number(((totalDemand * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  return {
    speedSensor: {
      waterSpeed: Number(speed.toFixed(2)),
      waterFlow: flow,
      waterTemp: temp,
      generationRate: Number(speedRate.toFixed(1)),
      bytesRate: Number(((speedRate * LOCAL_SPEED_SENSOR_BYTES) / 1000).toFixed(2)),
      rawSensorBytes: LOCAL_SPEED_SENSOR_BYTES,
    },
    tempSensor: {
      waterSpeed: Number(speed.toFixed(2)),
      waterFlow: flow,
      waterTemp: temp,
      generationRate: Number(tempRate.toFixed(1)),
      bytesRate: Number(((tempRate * LOCAL_TEMP_SENSOR_BYTES) / 1000).toFixed(2)),
      rawSensorBytes: LOCAL_TEMP_SENSOR_BYTES,
    },
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
        speedSensor: telemetry.speedSensor,
        tempSensor: telemetry.tempSensor,
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
      speedSensor: telemetry.speedSensor,
      tempSensor: telemetry.tempSensor,
    };
    
    // In unoptimized mode (if sensors don't consolidate through gateway),
    // they send separate packets with 25% extra header overhead!
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
    let dz_k = (admittedDemand - gwProcessing) * dt;
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

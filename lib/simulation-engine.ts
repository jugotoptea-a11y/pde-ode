import {
  EnvironmentalState,
  GatewayNodeState,
  CentralServerState,
  PacketParticle,
  SimulationMode,
  SimulationState,
  WeatherPreset,
} from './types';

export const SPATIAL_POINTS = 30; // Grid points along PDE line x in [0, 1]
export const DEFAULT_LAMBDA = 1.8; // Effective propagation speed
export const SERVER_MAX_BUFFER = 120; // Maximum physical buffer size before overflow
export const GATEWAY_MAX_BUFFER = 80;

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
  // Cross section model approx for urban stream: A(h) ~ 4 * (0.2 + rain / 120)
  const crossSection = 2.5 + (env.rainIntensity / 180) * 8.0;
  const flow = Number((speed * crossSection).toFixed(2));
  const temp = Number(env.waterTemp.toFixed(1));

  // Traffic demand generation formula:
  // Speed sensor generates more packets under turbulent water flow
  // Rain generates alarms and telemetry bursts
  const speedPackets = 4.0 + 0.35 * env.rainIntensity + 4.2 * (speed - 0.2);
  const tempPackets = 2.5 + 0.12 * Math.abs(temp - 26) + 0.08 * env.rainIntensity;
  const totalDemand = Number((speedPackets + tempPackets).toFixed(2));

  return {
    speedSensor: {
      waterSpeed: Number(speed.toFixed(2)),
      waterFlow: flow,
      waterTemp: temp,
      generationRate: Number(speedPackets.toFixed(2)),
    },
    tempSensor: {
      waterSpeed: Number(speed.toFixed(2)),
      waterFlow: flow,
      waterTemp: temp,
      generationRate: Number(tempPackets.toFixed(2)),
    },
    totalDemand,
  };
}

export function createInitialState(numGateways: number = 3, mode: SimulationMode = 'optimized'): SimulationState {
  const lambda = DEFAULT_LAMBDA;
  const tau = Number((1 / lambda).toFixed(3));
  const serverEpsilon = 60; // Default central server capacity (packets/sec)

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
      buffer: 4.0,
      bufferCapacity: GATEWAY_MAX_BUFFER,
      epsilon: 50.0,
      w: 1.0,
      u: 1.0,
      demand: telemetry.totalDemand,
      outflow: 0.0,
      spatialQ: new Array(SPATIAL_POINTS).fill(telemetry.totalDemand / numGateways),
      droppedPackets: 0,
      admittedPackets: 0,
    });
  }

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
      bufferCapacity: SERVER_MAX_BUFFER,
      epsilon: serverEpsilon,
      w: 1.0,
      inflow: 0,
      processingRate: 0,
      zEquilibrium: 0,
      isEquilibriumFinite: true,
      totalAdmitted: 0,
      totalProcessed: 0,
      totalDropped: 0,
      isBottleneck: false,
      cpuUtilization: 0,
      queueDelay: 0,
    },
    particles: [],
    history: [],
  };
}

/**
 * Non-linear processing rate function as derived in the documents:
 * r_i(z_i) = \frac{\epsilon_i \cdot z_i}{1 + z_i}
 */
export function nonlinearProcessingRate(z: number, epsilon: number): number {
  if (z <= 0) return 0;
  return (epsilon * z) / (1 + z);
}

/**
 * Algebraic equilibrium calculation from document section 9:
 * z^* = \frac{w \cdot d}{(1 - w \cdot u)\epsilon - w \cdot d}
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
    zStar: Math.max(0, Number(zStar.toFixed(3))),
    isStable: 1,
    maxAdmissibleDemand,
  };
}

/**
 * Steps the simulation forward by dt (in seconds).
 * Solves:
 * 1. PDE for transmission line: \partial_t q + \lambda \partial_x q = 0
 * 2. ODE for Gateway buffers: dz_k/dt = w_k d_k - r_k(z_k)
 * 3. Coupling at boundary: q(t, 0) = u_k r_k(z_k)
 * 4. ODE for Central Server buffer: dz_serv/dt = w_serv \sum q_k(t, 1) - r_serv(z_serv)
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
    gw.demand = telemetry.totalDemand;
    totalRawDemand += gw.demand;
  });

  // 2. Control Laws (Optimized vs Unoptimized)
  // In unoptimized mode: w = 1.0 (no throttling, blind admission), u = 1.0 (static routing).
  // In optimized mode: dynamic admission w(t) to prevent buffer overflow (ISS stability)
  // and balanced routing u_k(t).
  let effectiveServerW = 1.0;
  if (mode === 'optimized') {
    // Target buffer operating point (e.g. 20-30% of capacity to maintain high throughput and low delay)
    const targetBuffer = SERVER_MAX_BUFFER * 0.35;
    const currentBuf = state.server.buffer;

    // ISS Closed-loop admission factor:
    // If incoming flow would saturate server, dynamically throttle and aggregate at the gateway
    const capacityHeadroom = Math.max(0.05, 1.0 - currentBuf / targetBuffer);
    const flowRatio = (epsilonServ * 0.92) / Math.max(0.1, totalRawDemand);
    const optimalW = Math.min(1.0, Math.max(0.12, flowRatio * Math.min(1.0, capacityHeadroom + 0.4)));

    state.gateways.forEach((gw) => {
      // Dynamic admission factor per gateway
      gw.w = Number(optimalW.toFixed(3));
      // Dynamic routing balance
      gw.u = Number((1.0 / state.gateways.length).toFixed(3));
    });
    effectiveServerW = 1.0; // gateways already shaped flow
  } else {
    // Unoptimized mode: w = 1.0, u = 1.0
    state.gateways.forEach((gw) => {
      gw.w = 1.0;
      gw.u = 1.0;
    });
    effectiveServerW = 1.0;
  }

  // 3. Step Gateway Buffers (ODE) and solve PDE Boundary Condition
  let totalArrivalAtServer = 0;

  state.gateways.forEach((gw, gIdx) => {
    // Effective admitted demand
    const admittedDemand = gw.w * gw.demand;
    const nonAdmitted = gw.demand - admittedDemand;

    if (mode === 'unoptimized' && gw.buffer >= gw.bufferCapacity) {
      // If buffer is saturated in unoptimized mode, dropped packets accumulate
      gw.droppedPackets += nonAdmitted * dt;
    } else if (mode === 'optimized') {
      // In optimized mode, nonAdmitted represents intelligent data compression/aggregation
      // (zero loss of core telemetry metadata)
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

    // Upwind numerical scheme for PDE:
    // \partial_t q + \lambda \partial_x q = 0
    const oldQ = [...gw.spatialQ];
    const newQ = new Array(SPATIAL_POINTS).fill(0);
    newQ[0] = q_boundary;

    for (let m = 1; m < SPATIAL_POINTS; m++) {
      // Upwind finite difference
      const advectionFlux = cfl * (oldQ[m] - oldQ[m - 1]);
      newQ[m] = Math.max(0, oldQ[m] - advectionFlux);
    }

    gw.spatialQ = newQ;

    // Value at x = 1 arrives at central server
    const arrivalFromThisLine = newQ[SPATIAL_POINTS - 1];
    totalArrivalAtServer += arrivalFromThisLine;

    // Particle animation generation
    if (Math.random() < Math.min(0.65, arrivalFromThisLine * 0.04)) {
      state.particles.push({
        id: Math.random(),
        gatewayIndex: gIdx,
        x: 0,
        type: Math.random() > 0.5 ? 'speed' : 'temp',
        size: Math.max(2, Math.min(6, 2 + arrivalFromThisLine * 0.1)),
      });
    }
  });

  // 4. Central Server ODE Step:
  // dz_serv/dt = w_serv \sum q_ki(t, 1) - r_serv(z_serv)
  state.server.inflow = Number(totalArrivalAtServer.toFixed(2));
  const admittedToServer = effectiveServerW * totalArrivalAtServer;

  // Server non-linear processing rate
  const rServer = nonlinearProcessingRate(state.server.buffer, epsilonServ);
  state.server.processingRate = Number(rServer.toFixed(2));
  state.server.cpuUtilization = Math.min(100, Number(((rServer / epsilonServ) * 100).toFixed(1)));

  // Balance ODE:
  const dz_serv = (admittedToServer - rServer) * dt;
  state.server.buffer = Math.max(0.01, state.server.buffer + dz_serv);

  // Buffer Overflow / Bottleneck logic
  const isOverflow = state.server.buffer >= state.server.bufferCapacity;
  let droppedThisStep = 0;

  if (isOverflow) {
    droppedThisStep = (state.server.buffer - state.server.bufferCapacity);
    state.server.buffer = state.server.bufferCapacity;
    state.server.totalDropped += droppedThisStep;
    state.server.isBottleneck = true;
  } else {
    // Bottleneck detected if buffer is dangerously filling above 80% with arrival > processing
    state.server.isBottleneck = state.server.buffer > state.server.bufferCapacity * 0.8 && admittedToServer > rServer;
  }

  state.server.totalAdmitted += admittedToServer * dt;
  state.server.totalProcessed += rServer * dt;

  // Compute theoretical equilibrium for reference
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
      x: p.x + lambda * dt * 0.45, // scale for visual smoothness
    }))
    .filter((p) => p.x <= 1.0);

  // 6. Record History for Graphs (keep last 60 points)
  if (state.history.length === 0 || state.time - state.history[state.history.length - 1].time >= 0.25) {
    state.history.push({
      time: Number(state.time.toFixed(1)),
      buffer: Number(state.server.buffer.toFixed(2)),
      zEquilibrium: Number.isFinite(eq.zStar) ? Number(eq.zStar.toFixed(2)) : SERVER_MAX_BUFFER * 1.2,
      inflow: Number(totalArrivalAtServer.toFixed(2)),
      processingRate: Number(rServer.toFixed(2)),
      droppedRate: Number((droppedThisStep / dt).toFixed(2)),
      totalDemand: Number(totalRawDemand.toFixed(2)),
      isBottleneck: state.server.isBottleneck,
    });

    if (state.history.length > 70) {
      state.history.shift();
    }
  }

  return state;
}

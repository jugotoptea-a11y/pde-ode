import {
  EnvironmentalState,
  GatewayNodeState,
  SimulationMode,
  SimulationState,
  WeatherPreset,
} from './types';

// ============================================================================
// CONSTANTES FÍSICAS Y DE TELEMETRÍA IoT (ESCALA REAL EN BYTES Y KILOBYTES)
// ============================================================================

// Peso de las lecturas locales crudas generadas por cada sensor de campo:
export const LOCAL_RAIN_SENSOR_BYTES = 20;  // ~20 Bytes por lectura local del Pluviómetro
export const LOCAL_WATER_SENSOR_BYTES = 20; // ~20 Bytes por lectura local del Sensor de Agua (Caudal Q y Velocidad v acoplados)

// Peso del paquete consolidado en el Gateway vs transmisión individual sin consolidar:
export const UNIFIED_PACKET_BYTES = 119;    // ~119 Bytes: payload JSON unificado + cabeceras IP/UDP
export const SEPARATE_TX_BYTES = 158;       // ~158 Bytes: cuando los sensores transmiten por separado duplicando cabeceras
export const BANDWIDTH_SAVING_PERCENT = 24.7; // ~24.7% de ahorro neto de ancho de banda mediante consolidación en Gateway

// Parámetros numéricos de discretización espacial y capacidad física de colas:
export const SPATIAL_POINTS = 30;      // Número de nodos espaciales M en la malla x ∈ [0, 1] para el esquema Upwind de la PDE
export const DEFAULT_LAMBDA = 1.8;     // Velocidad efectiva de propagación \lambda [s⁻¹] (retardo \tau = 1/\lambda ≈ 0.556 s)
export const SERVER_MAX_BUFFER = 120;  // Capacidad física máxima del búfer del Servidor Central Z_max [paquetes] (~14.28 kB)
export const GATEWAY_MAX_BUFFER = 80;  // Capacidad física máxima del búfer de cada Gateway [paquetes] (~9.52 kB)

// Fracción agregada de enrutamiento/recirculación u = \sum_{k=1}^N u_{ki} ∈ [0, 1) bajo reducción escalar:
// Representa el porcentaje del tráfico procesado que se recircula o multiplexa por las líneas (20%),
// mientras que el 80% restante (1 - u) constituye la salida neta evacuada por el servidor.
export const DEFAULT_ROUTING_U = 0.20;

// ============================================================================
// MATRIZ EMPÍRICA HIDRODINÁMICA (60 PARES ACOPLADOS CAUDAL Q - VELOCIDAD v)
// Fuente: Estudio de drenaje pluvial urbano en Barranquilla (Humberto Ávila)
// ============================================================================

export interface FlowVelocityPair {
  flow: number;  // Caudal estimado Q [m³/s]
  speed: number; // Velocidad media del agua v [m/s]
}

// Los 60 pares empíricos ordenados de forma ascendente por caudal para progresión continua:
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

/**
 * Obtiene de forma segura un par empírico (Caudal Q, Velocidad v) a partir de su índice [0 - 59].
 */
export function getFlowVelocityPair(index: number): FlowVelocityPair {
  const safeIdx = Math.max(0, Math.min(EMPIRICAL_FLOW_SPEED_PAIRS.length - 1, Math.round(index)));
  return EMPIRICAL_FLOW_SPEED_PAIRS[safeIdx];
}

// Ubicaciones, distancias físicas L_k y velocidades efectivas heterogéneas de los Gateways IoT LoRa (Nivel 1):
// Todos los nodos transmiten mediante tecnología LoRa, donde la velocidad efectiva \lambda_k = v_{LoRa,k} / L_k [s⁻¹]
// y el retardo de tránsito (Time-on-Air + propagación) \tau_k = 1/\lambda_k [s] dependen de la distancia física L_k
// y del Factor de Dispersión asignado (Spreading Factor: SF7 a SF10):
export const DEFAULT_GATEWAY_LOCATIONS = [
  { name: 'Gateway 1', location: 'Canal Primario - Estación Cercana', distanceKm: 1.2, loraSF: 'SF7', lambda: 2.4 },    // \tau_1 ≈ 0.417 s
  { name: 'Gateway 2', location: 'Canal Secundario - Estación Media', distanceKm: 2.5, loraSF: 'SF8', lambda: 1.8 },    // \tau_2 ≈ 0.556 s
  { name: 'Gateway 3', location: 'Colector Auxiliar - Estación Urbana', distanceKm: 3.8, loraSF: 'SF9', lambda: 1.25 }, // \tau_3 = 0.800 s
  { name: 'Gateway 4', location: 'Colector de Alivio - Cuenca Alta', distanceKm: 5.5, loraSF: 'SF10', lambda: 0.90 },   // \tau_4 ≈ 1.111 s
];

/**
 * Estima la distancia física equivalente L_k [km] y el Factor de Dispersión LoRa (SF7–SF12)
 * correspondiente a una velocidad efectiva normalizada \lambda_k [s⁻¹].
 */
export function deriveLoRaParamsFromLambda(lambda: number): { distanceKm: number; loraSF: string } {
  const distanceKm = Number(Math.max(0.5, Math.min(8.5, 4.9 / Math.max(0.4, lambda) - 0.55)).toFixed(1));
  let loraSF = 'SF7';
  if (lambda >= 2.1) loraSF = 'SF7';
  else if (lambda >= 1.55) loraSF = 'SF8';
  else if (lambda >= 1.1) loraSF = 'SF9';
  else if (lambda >= 0.75) loraSF = 'SF10';
  else loraSF = 'SF11';
  return { distanceKm, loraSF };
}

/**
 * Crea el estado ambiental inicial según el escenario meteorológico seleccionado.
 * Rango histórico de precipitación: 0.8 mm (estiaje seco) a 160.5 mm (pico histórico), extensible a 180 mm.
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
 * Calcula las tasas de generación de paquetes de los sensores locales:
 * 1) Pluviómetro: d_pluv(P) = 3.0 + 0.28 * P [paq/s]
 * 2) Sensor de Agua (Q y v acoplados): d_water(Q, v) = 3.5 + 0.18 * Q + 2.2 * (v - 3.5) [paq/s]
 * Demanda del canal k: d_k = d_pluv(P) + d_water(Q, v) [paq/s]
 */
export function computeSensorTelemetry(env: EnvironmentalState) {
  const rain = Math.max(0, env.rain_mm);
  const pair = getFlowVelocityPair(env.flowIndex);
  const flow = pair.flow;
  const speed = pair.speed;

  // 1. Tasa del Pluviómetro: telemetría base 3.0 paq/s + incremento proporcional a los mm de lluvia
  const rainRate = 3.0 + 0.28 * rain;

  // 2. Tasa del Sensor de Agua: base 3.5 paq/s + escalamiento por caudal Q y velocidad v
  const waterRate = 3.5 + 0.18 * flow + 2.2 * Math.max(0, speed - 3.5);

  // Demanda total de paquetes del nodo k en [paq/s]
  const totalDemand = Number((rainRate + waterRate).toFixed(1));

  // Equivalencia en [kB/s] (cada paquete consolidado pesa 119 Bytes = 0.119 kB)
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

/**
 * Función no lineal de tasa de procesamiento (saturación tipo Michaelis-Menten / Guffens):
 * r(z) = (\varepsilon * z) / (1 + z) [paq/s]
 * Cumple r(0) = 0 y límite asintótico \lim_{z \to \infty} r(z) = \varepsilon.
 */
export function nonlinearProcessingRate(z: number, epsilon: number): number {
  if (z <= 0) return 0;
  return (epsilon * z) / (1 + z);
}

/**
 * Cálculo analítico exacto del punto de equilibrio estacionario z* bajo reducción escalar homogénea:
 *   0 = w*d + w*u * r(z*) - r(z*)  ==>  w*d = (1 - w*u) * (\varepsilon * z*) / (1 + z*)
 *   z* = (w * d) / [(1 - w * u) * \varepsilon - w * d]
 */
export function calculateEquilibrium(
  w: number,
  u: number,
  d: number,
  epsilon: number
): { zStar: number; isStable: number; maxAdmissibleDemand: number } {
  const netCapacity = (1 - w * u) * epsilon;
  const denominator = netCapacity - w * d;
  const maxAdmissibleDemand = w > 0 ? netCapacity / w : netCapacity;

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
 * Cálculo analítico del punto de equilibrio estacionario z* para la Red en Estrella Heterogénea (Nivel 1):
 * Cada línea k posee su propia demanda d_k, su factor de admisión w_k, su fracción de enrutamiento u_{ki}
 * y su retardo de propagación individual \tau_k = 1 / \lambda_k.
 *
 * En régimen permanente (dz/dt = 0 y z(t - \tau_k) = z* para todo k):
 *   \sum_{k=1}^N w_k d_k + (\sum_{k=1}^N w_k u_{ki}) * r(z*) - r(z*) = 0
 *   ==> r(z*) = (\sum_{k=1}^N w_k d_k) / (1 - \sum_{k=1}^N w_k u_{ki})
 *
 * Sustituyendo r(z*) = (\varepsilon * z*) / (1 + z*):
 *   z* = (\sum_{k=1}^N w_k d_k) / [(1 - \sum_{k=1}^N w_k u_{ki}) * \varepsilon - \sum_{k=1}^N w_k d_k]
 *
 * Condición de existencia y Cero Desborde por suma ponderada:
 *   \sum_{k=1}^N w_k d_k < (1 - \sum_{k=1}^N w_k u_{ki}) * \varepsilon
 */
export function calculateHeterogeneousEquilibrium(
  gateways: Pick<GatewayNodeState, 'w' | 'u' | 'demand'>[],
  epsilon: number
): {
  zStar: number;
  isStable: number;
  weightedDemand: number;
  weightedRouting: number;
  rStar: number;
} {
  // Suma ponderada de demanda externa admitida: D_w = \sum_{k=1}^N w_k * d_k
  const weightedDemand = gateways.reduce((acc, gw) => acc + gw.w * gw.demand, 0);
  // Suma ponderada de fracción de enrutamiento efectivo: U_w = \sum_{k=1}^N w_k * u_{ki}
  const weightedRouting = gateways.reduce((acc, gw) => acc + gw.w * gw.u, 0);

  // Capacidad neta efectiva del servidor: (1 - \sum w_k u_{ki}) * \varepsilon
  const netCapacity = (1 - weightedRouting) * epsilon;
  // Denominador del equilibrio heterogéneo: (1 - \sum w_k u_{ki}) * \varepsilon - \sum w_k d_k
  const denominator = netCapacity - weightedDemand;

  if (1 - weightedRouting <= 0.001 || denominator <= 0.001) {
    return {
      zStar: Infinity,
      isStable: 0,
      weightedDemand: Number(weightedDemand.toFixed(2)),
      weightedRouting: Number(weightedRouting.toFixed(3)),
      rStar: epsilon,
    };
  }

  const zStar = weightedDemand / denominator;
  const rStar = weightedDemand / (1 - weightedRouting);

  return {
    zStar: Math.max(0, Number(zStar.toFixed(2))),
    isStable: 1,
    weightedDemand: Number(weightedDemand.toFixed(2)),
    weightedRouting: Number(weightedRouting.toFixed(3)),
    rStar: Number(rStar.toFixed(2)),
  };
}

/**
 * Construye el estado inicial completo del sistema para N Gateways heterogéneos (Nivel 1: \lambda_k y \tau_k distintos)
 * que convergen en el Servidor Central.
 */
export function createInitialState(numGateways: number = 3, mode: SimulationMode = 'optimized'): SimulationState {
  const serverEpsilon = 60; // Capacidad asintótica por defecto del servidor central \varepsilon = 60 paq/s (~7.14 kB/s)

  // Fracción agregada de enrutamiento u = \sum_{k=1}^N u_{ki} = 0.20
  const totalU = DEFAULT_ROUTING_U;
  const perLineU = Number((totalU / numGateways).toFixed(3));

  const gateways: GatewayNodeState[] = [];
  let initialTotalDemand = 0;

  for (let i = 0; i < numGateways; i++) {
    const loc = DEFAULT_GATEWAY_LOCATIONS[i] || {
      name: `Gateway ${i + 1}`,
      location: `Estación Auxiliar ${i + 1}`,
      distanceKm: 2.5,
      loraSF: 'SF8',
      lambda: DEFAULT_LAMBDA,
    };
    const lineLambda = loc.lambda;
    const lineTau = Number((1 / lineLambda).toFixed(3));
    const env = createInitialEnvironmentalState('dry');
    const telemetry = computeSensorTelemetry(env);

    // En modo no optimizado, el envío sin consolidar agrega sobrecarga de cabeceras (158 B vs 119 B)
    const effectiveDemand =
      mode === 'unoptimized'
        ? Number((telemetry.totalDemand * (SEPARATE_TX_BYTES / UNIFIED_PACKET_BYTES)).toFixed(1))
        : telemetry.totalDemand;

    initialTotalDemand += effectiveDemand;

    gateways.push({
      id: `gw-${i + 1}`,
      name: loc.name,
      location: loc.location,
      distanceKm: loc.distanceKm, // Distancia física L_k [km]
      loraSF: loc.loraSF,         // Factor de Dispersión LoRa (SF7 a SF10)
      environment: env,
      sensors: {
        rainSensor: telemetry.rainSensor,
        waterSensor: telemetry.waterSensor,
      },
      lambda: lineLambda, // Velocidad de propagación individual \lambda_k [s⁻¹]
      tau: lineTau,       // Retardo de propagación individual \tau_k = 1/\lambda_k [s]
      buffer: 1.5,        // Ocupación inicial ligera del búfer local del Gateway [paq]
      bufferCapacity: GATEWAY_MAX_BUFFER,
      epsilon: 90.0,      // Capacidad holgada de empaquetado del Gateway IoT
      w: 1.0,
      u: perLineU,        // Fracción de enrutamiento inicial u_{ki}
      demand: effectiveDemand,
      demandKBS: Number(((effectiveDemand * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      outflow: effectiveDemand,
      spatialQ: new Array(SPATIAL_POINTS).fill(effectiveDemand),
      droppedPackets: 0,
      admittedPackets: 0,
      bandwidthSavedKB: 0,
    });
  }

  // Promedio de velocidades y retardos para referencia global
  const avgLambda = Number((gateways.reduce((s, g) => s + g.lambda, 0) / numGateways).toFixed(2));
  const avgTau = Number((gateways.reduce((s, g) => s + g.tau, 0) / numGateways).toFixed(3));

  // Cálculo del punto de equilibrio inicial z* mediante suma ponderada heterogénea (Nivel 1)
  const initialEq = calculateHeterogeneousEquilibrium(gateways, serverEpsilon);
  const initialBuffer = Number.isFinite(initialEq.zStar) ? Math.min(SERVER_MAX_BUFFER, initialEq.zStar) : 6.0;
  const initialR = nonlinearProcessingRate(initialBuffer, serverEpsilon);

  // Inicializamos el perfil espacial q_{ki}(0, x) con el flujo estacionario inicial de cada línea
  gateways.forEach((gw) => {
    const lineFlow = gw.w * gw.demand + gw.w * gw.u * initialR;
    gw.spatialQ = new Array(SPATIAL_POINTS).fill(Number(lineFlow.toFixed(2)));
  });

  const serverEpsKBS = Number(((serverEpsilon * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
  const initialInflow = initialEq.weightedDemand + initialEq.weightedRouting * initialR;

  return {
    time: 0,
    mode,
    numGateways,
    lambda: avgLambda,
    tau: avgTau,
    serverEpsilon,
    gateways,
    server: {
      buffer: Number(initialBuffer.toFixed(2)),
      bufferKB: Number(((initialBuffer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      bufferCapacity: SERVER_MAX_BUFFER,
      epsilon: serverEpsilon,
      epsilonKBS: serverEpsKBS,
      w: 1.0,
      u: totalU,
      weightedDemand: initialEq.weightedDemand,
      weightedRouting: initialEq.weightedRouting,
      inflow: Number(initialInflow.toFixed(1)),
      inflowKBS: Number(((initialInflow * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      processingRate: Number(initialR.toFixed(1)),
      processingRateKBS: Number(((initialR * UNIFIED_PACKET_BYTES) / 1000).toFixed(2)),
      zEquilibrium: initialEq.zStar,
      isEquilibriumFinite: initialEq.isStable === 1,
      totalAdmitted: 0,
      totalProcessed: 0,
      totalDropped: 0,
      totalDroppedKB: 0,
      isBottleneck: false,
      cpuUtilization: Number(((initialR / serverEpsilon) * 100).toFixed(1)),
      queueDelay: Number(((initialBuffer / Math.max(0.5, initialR)) * 100).toFixed(0)),
      totalBandwidthSavingsPercent: BANDWIDTH_SAVING_PERCENT,
    },
    particles: [],
    history: [],
  };
}

/**
 * Avanza la simulación híbrida PDE-ODE en Configuración Heterogénea (Nivel 1) un paso temporal dt [segundos].
 * Integra:
 * 1) Generación de demanda individual d_k(t) en cada uno de los N Gateways.
 * 2) Asignación heterogénea de fracción de enrutamiento u_{ki}(t) y tasa de admisión w_k(t) ponderada por
 *    demanda local d_k, retardo del enlace \tau_k = 1/\lambda_k y estado de llenado del búfer z(t).
 * 3) Transporte espacial por diferencias finitas Upwind en cada línea PDE k con su propia velocidad \lambda_k
 *    y su propio número de Courant CFL_k = (\lambda_k * dt) / dx.
 * 4) Ecuación diferencial ordinaria (ODE) no lineal en el Servidor Central con retardos múltiples \tau_k
 *    y cálculo de equilibrio por suma ponderada r(z*) = (\sum w_k d_k) / (1 - \sum w_k u_{ki}).
 */
export function stepSimulation(currentState: SimulationState, dt: number): SimulationState {
  // Clonación profunda del estado para mantener inmutabilidad en el ciclo de React
  const state: SimulationState = JSON.parse(JSON.stringify(currentState));
  state.time += dt;

  const mode = state.mode;
  const epsilonServ = state.serverEpsilon;
  const numLines = state.gateways.length;

  // Paso espacial \Delta x en la línea normalizada x ∈ [0, 1]
  const dx = 1.0 / (SPATIAL_POINTS - 1);

  // ==========================================================================
  // PASO 1: Actualizar la telemetría de sensores y demanda externa d_k(t)
  // ==========================================================================
  let totalRawDemand = 0; // Demanda externa agregada d(t) = \sum_{k=1}^N d_k(t)

  state.gateways.forEach((gw) => {
    // Asegurar consistencia entre velocidad \lambda_k y retardo \tau_k = 1 / \lambda_k
    gw.lambda = Math.max(0.3, gw.lambda || DEFAULT_LAMBDA);
    gw.tau = Number((1 / gw.lambda).toFixed(3));

    const telemetry = computeSensorTelemetry(gw.environment);
    gw.sensors = {
      rainSensor: telemetry.rainSensor,
      waterSensor: telemetry.waterSensor,
    };
    gw.environment.waterFlow = telemetry.waterFlow;
    gw.environment.waterSpeed = telemetry.waterSpeed;

    // En modo No Optimizado (sin consolidación en el Gateway), las lecturas viajan en paquetes
    // separados (158 B vs 119 B), incrementando la carga efectiva sobre la red en ~32.8%:
    const effectiveDemand =
      mode === 'unoptimized'
        ? Number((telemetry.totalDemand * (SEPARATE_TX_BYTES / UNIFIED_PACKET_BYTES)).toFixed(1))
        : telemetry.totalDemand;

    gw.demand = effectiveDemand;
    gw.demandKBS = Number(((effectiveDemand * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
    totalRawDemand += gw.demand;

    // Contabilizar el ahorro acumulado de ancho de banda en modo Optimizado [kB]
    if (mode === 'optimized') {
      const savedBytesPerSec = telemetry.totalDemand * (SEPARATE_TX_BYTES - UNIFIED_PACKET_BYTES);
      gw.bandwidthSavedKB += (savedBytesPerSec * dt) / 1000;
    }
  });

  // ==========================================================================
  // PASO 2: Leyes Heterogéneas de Control de Admisión w_k(t) y Enrutamiento u_{ki}(t) (Nivel 1)
  // ==========================================================================
  // 2.1 Fracción de enrutamiento individual u_{ki}(t):
  // Se pondera según la demanda d_k(t) y la capacidad de transporte \sqrt{\lambda_k} de cada línea,
  // manteniendo la suma total \sum_{k=1}^N u_{ki} = u = 0.20:
  const totalU = DEFAULT_ROUTING_U;
  const routingWeights = state.gateways.map((gw) => Math.max(0.1, gw.demand * Math.sqrt(gw.lambda)));
  const sumRoutingWeights = routingWeights.reduce((a, b) => a + b, 0);

  state.gateways.forEach((gw, idx) => {
    gw.u = Number(((totalU * routingWeights[idx]) / sumRoutingWeights).toFixed(3));
  });

  // 2.2 Tasa de admisión individual w_k(t) por cada línea k:
  if (mode === 'optimized') {
    // LEY DE CONTROL DE ADMISIÓN HETEROGÉNEA ISS (Nivel 1):
    // 1) El Servidor Central mide su margen de espacio libre relativo: \eta(t) = min(0.90, max(0.10, 1 - z(t)/Z_max)).
    const freeSpaceFactor = Math.max(0.10, 1.0 - state.server.buffer / SERVER_MAX_BUFFER);
    const safeUtilizationEta = Math.min(0.90, freeSpaceFactor);

    // 2) Cada Gateway k calcula una pre-ponderación local \tilde{w}_k ∈ (0, 1] determinada por:
    //    - Su carga de demanda local d_k(t) respecto a la cuota nominal por línea (\varepsilon / N)
    //    - Su retardo de propagación individual \tau_k = 1/\lambda_k (canales más lentos se regulan con mayor prudencia
    //      para prevenir oscilaciones de fase multirretardo en el búfer central).
    const nominalPerLineCap = epsilonServ / Math.max(1, numLines);
    const rawW = state.gateways.map((gw) => {
      const loadRatio = gw.demand / nominalPerLineCap;
      const delayPenalty = 1 + 0.12 * Math.max(0, gw.tau - 0.5);
      // Si el canal está en estiaje seco (loadRatio <= 0.75), \tilde{w}_k permanece en 1.0;
      // si sufre crecida o tormenta, reduce preventivamente su apertura en función de su sobrecarga y retardo:
      if (loadRatio * delayPenalty <= 0.75) return 1.0;
      return Math.min(1.0, Math.max(0.10, 0.85 / (loadRatio * delayPenalty)));
    });

    // 3) Escalamiento global exacto para garantizar la condición de estabilidad por Suma Ponderada:
    //    \sum_{k=1}^N w_k d_k <= \eta(t) * (1 - \sum_{k=1}^N w_k u_{ki}) * \varepsilon
    //    Sea w_k = \gamma * \tilde{w}_k. Entonces:
    //    \gamma * [\sum \tilde{w}_k d_k + \eta(t) * \varepsilon * \sum \tilde{w}_k u_{ki}] <= \eta(t) * \varepsilon
    const tildeD = state.gateways.reduce((acc, gw, idx) => acc + rawW[idx] * gw.demand, 0);
    const tildeU = state.gateways.reduce((acc, gw, idx) => acc + rawW[idx] * gw.u, 0);
    const maxAllowedScale = (safeUtilizationEta * epsilonServ) / Math.max(0.1, tildeD + safeUtilizationEta * epsilonServ * tildeU);
    const gamma = Math.min(1.0, maxAllowedScale);

    state.gateways.forEach((gw, idx) => {
      gw.w = Number(Math.min(1.0, Math.max(0.05, gamma * rawW[idx])).toFixed(3));
    });
  } else {
    // MODO NO OPTIMIZADO (FIFO convencional en lazo abierto):
    // No existe control de admisión (w_k = 1.0 para todas las líneas), ingresando toda la tormenta sin filtro.
    state.gateways.forEach((gw) => {
      gw.w = 1.0;
    });
  }

  // Cálculo de las sumas ponderadas y del factor medio efectivo para visualización en el Servidor
  const weightedDemandSum = state.gateways.reduce((acc, gw) => acc + gw.w * gw.demand, 0);
  const weightedRoutingSum = state.gateways.reduce((acc, gw) => acc + gw.w * gw.u, 0);
  const avgEffectiveW = totalRawDemand > 0 ? weightedDemandSum / totalRawDemand : 1.0;

  state.server.w = Number(avgEffectiveW.toFixed(3));
  state.server.u = totalU;
  state.server.weightedDemand = Number(weightedDemandSum.toFixed(2));
  state.server.weightedRouting = Number(weightedRoutingSum.toFixed(3));

  // Actualizar promedios de velocidad \lambda y retardo \tau del estado global
  state.lambda = Number((state.gateways.reduce((s, g) => s + g.lambda, 0) / numLines).toFixed(2));
  state.tau = Number((state.gateways.reduce((s, g) => s + g.tau, 0) / numLines).toFixed(3));

  // Tasa instantánea de procesamiento actual del Servidor Central r(z(t)) = \varepsilon * z(t) / (1 + z(t))
  const currentServerR = nonlinearProcessingRate(state.server.buffer, epsilonServ);

  // ==========================================================================
  // PASO 3: Dinámica de cada Gateway y Solución Numérica de las N Líneas PDE Heterogéneas
  // ==========================================================================
  let totalArrivalAtServer = 0; // Suma de flujos que arriban en x = 1: \sum_{k=1}^N q_{ki}(t, 1)

  state.gateways.forEach((gw, gIdx) => {
    // Flujo externo admitido individualmente por el Gateway k: w_k(t) * d_k(t)
    const admittedDemand = gw.w * gw.demand;
    const rejectedAtGateway = gw.demand - admittedDemand;

    // Contabilizar paquetes admitidos en el Gateway
    gw.admittedPackets += admittedDemand * dt;

    // Evolución del búfer local del Gateway k (para visualización de carga en la pasarela)
    const gwCapacity = Math.max(80, epsilonServ * 1.2);
    gw.epsilon = gwCapacity;
    const gwProcessing = nonlinearProcessingRate(gw.buffer, gwCapacity);
    const dz_k = (admittedDemand - gwProcessing) * dt * 2.5;
    gw.buffer = Math.max(0.1, gw.buffer + dz_k);

    if (gw.buffer > gw.bufferCapacity) {
      const overflow = gw.buffer - gw.bufferCapacity;
      gw.buffer = gw.bufferCapacity;
      if (mode === 'unoptimized') {
        gw.droppedPackets += (overflow + rejectedAtGateway * dt);
      }
    }

    gw.outflow = admittedDemand;

    // CONDICIÓN DE FRONTERA DINÁMICA EN EL ORIGEN DE LA LÍNEA HETEROGÉNEA k (x = 0):
    // q_{ki}(t, 0) = w_k(t) * d_k(t) + w_k(t) * u_{ki}(t) * r(z(t))
    const q_boundary = admittedDemand + gw.w * gw.u * currentServerR;

    // ESQUEMA NUMÉRICO UPWIND DE PRIMER ORDEN CON VELOCIDAD INDIVIDUAL \lambda_k:
    // \partial q_{ki}/\partial t + \lambda_k \partial q_{ki}/\partial x = 0,  x ∈ [0, 1]
    // Cada línea posee su propio número de Courant-Friedrichs-Lewy CFL_k = (\lambda_k * dt) / dx
    // y su propio retardo de tránsito \tau_k = 1 / \lambda_k:
    const cfl_k = Math.min(0.95, (gw.lambda * dt) / dx);
    const oldQ = [...gw.spatialQ];
    const newQ = new Array(SPATIAL_POINTS).fill(0);
    newQ[0] = q_boundary;

    for (let m = 1; m < SPATIAL_POINTS; m++) {
      const advectionFlux = cfl_k * (oldQ[m] - oldQ[m - 1]);
      newQ[m] = Math.max(0, oldQ[m] - advectionFlux);
    }

    gw.spatialQ = newQ;

    // EVALUACIÓN EN LA FRONTERA RECEPTORA (x = 1, entrada al Servidor Central):
    // q_{ki}(t, 1) = q_{ki}(t - \tau_k, 0) arriba tras el retardo individual \tau_k = 1/\lambda_k
    const arrivalFromThisLine = newQ[SPATIAL_POINTS - 1];
    totalArrivalAtServer += arrivalFromThisLine;

    // Generación de partículas visuales animadas a lo largo del canal k
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

  // ==========================================================================
  // PASO 4: Integración de la ODE No Lineal Multirretardo en el Servidor Central
  // ==========================================================================
  // En la entrada del servidor (x = 1), confluyen las N líneas con sus respectivos retardos \tau_k:
  //   \sum_{k=1}^N q_{ki}(t, 1) = \sum_{k=1}^N [ w_k d_k(t - \tau_k) + w_k u_{ki} r(z(t - \tau_k)) ]
  // Por tanto, la ODE de balance en el Servidor Central es:
  //   dz/dt = \sum_{k=1}^N q_{ki}(t, 1) - r(z(t))
  state.server.inflow = Number(totalArrivalAtServer.toFixed(1));
  state.server.inflowKBS = Number(((totalArrivalAtServer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  // Tasa no lineal de procesamiento del servidor r(z) = \varepsilon * z / (1 + z)
  const rServer = nonlinearProcessingRate(state.server.buffer, epsilonServ);
  state.server.processingRate = Number(rServer.toFixed(1));
  state.server.processingRateKBS = Number(((rServer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
  state.server.cpuUtilization = Math.min(100, Number(((rServer / epsilonServ) * 100).toFixed(1)));
  state.server.epsilonKBS = Number(((epsilonServ * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  // Paso de integración de Euler hacia adelante para la ODE del búfer central:
  const dz_serv = (totalArrivalAtServer - rServer) * dt;
  state.server.buffer = Math.max(0.01, state.server.buffer + dz_serv);
  state.server.bufferKB = Number(((state.server.buffer * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));

  // ==========================================================================
  // PASO 5: Verificación de Desborde Físico y Equilibrio por Suma Ponderada z*
  // ==========================================================================
  const isOverflow = state.server.buffer >= state.server.bufferCapacity;
  let droppedThisStep = 0;

  if (isOverflow) {
    // Si z(t) alcanza el límite físico Z_max (120 paquetes), los paquetes excedentes se pierden por overflow
    droppedThisStep = state.server.buffer - state.server.bufferCapacity;
    state.server.buffer = state.server.bufferCapacity;
    state.server.bufferKB = Number(((SERVER_MAX_BUFFER * UNIFIED_PACKET_BYTES) / 1000).toFixed(2));
    state.server.totalDropped += droppedThisStep;
    state.server.totalDroppedKB = Number(((state.server.totalDropped * UNIFIED_PACKET_BYTES) / 1000).toFixed(1));
    state.server.isBottleneck = true;
  } else {
    // Alerta de cuello de botella si supera el 85% de Z_max y el flujo entrante supera la salida r(z)
    state.server.isBottleneck =
      state.server.buffer > state.server.bufferCapacity * 0.85 && totalArrivalAtServer > rServer;
  }

  state.server.totalAdmitted += totalArrivalAtServer * dt;
  state.server.totalProcessed += rServer * dt;

  // Cálculo del Punto de Equilibrio Analítico por Suma Ponderada (Nivel 1):
  //   r(z*) = (\sum w_k d_k) / (1 - \sum w_k u_{ki})
  //   z* = (\sum w_k d_k) / [(1 - \sum w_k u_{ki})\varepsilon - \sum w_k d_k]
  const eq = calculateHeterogeneousEquilibrium(state.gateways, epsilonServ);
  state.server.zEquilibrium = eq.zStar;
  state.server.isEquilibriumFinite = eq.isStable === 1;

  // Estimación de latencia en cola (tiempo medio de residencia \theta(z) = (1 + z)/\varepsilon en ms)
  state.server.queueDelay = Number(((state.server.buffer / Math.max(0.5, rServer)) * 100).toFixed(0));

  // ==========================================================================
  // PASO 6: Actualizar posición de partículas con velocidad individual \lambda_k
  // ==========================================================================
  state.particles = state.particles
    .map((p) => {
      const lineLambda = state.gateways[p.gatewayIndex]?.lambda || state.lambda;
      return {
        ...p,
        x: p.x + lineLambda * dt * 0.45,
      };
    })
    .filter((p) => p.x <= 1.0);

  // Registro periódico de muestras (cada 0.25 s) para las gráficas analíticas en tiempo real
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

    // Ventana deslizante de 70 muestras (~18 segundos)
    if (state.history.length > 70) {
      state.history.shift();
    }
  }

  return state;
}

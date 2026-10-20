// ============================================================================
// DEFINICIÓN DE TIPOS E INTERFACES DEL MODELO HÍBRIDO PDE-ODE (CERO DESBORDE)
// Basado en la formulación de Espitia, Girard, Marchand y Prieur (2017)
// bajo configuración Multilínea Heterogénea (Nivel 1: Retardos τ_k distintos
// y equilibrio por suma ponderada hacia el Servidor Central).
// ============================================================================

/**
 * Modalidad de operación del sistema:
 * - 'unoptimized': Modo convencional FIFO (sin control de admisión, w = 1.0, paquetes sin consolidar).
 * - 'optimized': Modo Cero DesBorde con control dinámico ISS en lazo cerrado y consolidación JSON.
 */
export type SimulationMode = 'unoptimized' | 'optimized';

/**
 * Escenarios hidrometeorológicos preconfigurados basados en los registros históricos
 * de precipitación (Ramírez-Cerpa et al.) y aforos de caudal/velocidad (Humberto Ávila).
 */
export type WeatherPreset = 'dry' | 'moderate' | 'torrential' | 'extreme_flood';

/**
 * Estado ambiental instantáneo registrado por la estación de monitoreo en cada canal.
 */
export interface EnvironmentalState {
  rain_mm: number;      // Precipitación pluvial acumulada P [0.8 - 180.0 mm]
  flowIndex: number;    // Índice [0 - 59] en la matriz empírica de 60 pares acoplados (Caudal, Velocidad)
  waterFlow: number;    // Caudal estimado en el canal Q [12 - 208 m³/s]
  waterSpeed: number;   // Velocidad media del flujo de agua v [3.7 - 10.4 m/s]
}

/**
 * Telemetría individual generada por cada sensor físico de campo antes del Gateway.
 */
export interface SensorTelemetry {
  name: string;           // Nombre del instrumento (Pluviómetro o Sensor de Agua)
  reading: string;        // Lectura física formateada con sus unidades
  generationRate: number; // Tasa de generación de paquetes [paq/s]
  bytesRate: number;      // Caudal de datos local [kB/s]
  rawBytes: number;       // Peso de la trama cruda local (~20 Bytes por lectura)
}

/**
 * Partícula visual que representa un paquete de datos propagándose por la línea PDE x ∈ [0, 1].
 */
export interface PacketParticle {
  id: number;           // Identificador único de la partícula animada
  gatewayIndex: number; // Índice de la línea de transmisión (Gateway k → Servidor Central)
  x: number;            // Posición espacial normalizada x ∈ [0, 1] a lo largo del canal PDE
  type: 'rain' | 'water' | 'unified'; // Tipo de trama representada
  size: number;         // Radio visual proporcional a la densidad del flujo
}

/**
 * Estado dinámico de cada pasarela concentradora (Gateway IoT k) y su línea de transmisión PDE heterogénea.
 */
export interface GatewayNodeState {
  id: string;              // Identificador del nodo (ej. 'gw-1')
  name: string;            // Nombre visible del Gateway
  location: string;        // Ubicación hidráulica de la estación de telemetría
  distanceKm: number;      // Distancia física del enlace LoRa al Servidor Central L_k [km]
  loraSF: string;          // Factor de Dispersión LoRa asignado (Spreading Factor: SF7 a SF10)
  environment: EnvironmentalState; // Condiciones hidrometeorológicas locales del canal
  sensors: {
    rainSensor: SensorTelemetry;   // Telemetría del Pluviómetro (lluvia P)
    waterSensor: SensorTelemetry;  // Telemetría del Sensor de Agua (par acoplado Q y v)
  };
  lambda: number;          // Velocidad de propagación individual de la línea k: \lambda_k [s⁻¹]
  tau: number;             // Retardo físico individual de la línea k: \tau_k = 1 / \lambda_k [s]
  buffer: number;          // Variable de estado local z_k(t) en paquetes (~119 B c/u)
  bufferCapacity: number;  // Capacidad física máxima del búfer del Gateway [paq]
  epsilon: number;         // Capacidad asintótica de procesamiento del Gateway \varepsilon_k [paq/s]
  w: number;               // Factor individual de control de admisión w_k(t) ∈ [0, 1]
  u: number;               // Fracción individual de enrutamiento de la línea u_{ki}(t) ∈ [0, 1), donde \sum u_{ki} = u
  demand: number;          // Demanda externa del canal d_k(t) [paq/s]
  demandKBS: number;       // Demanda externa del canal d_k(t) [kB/s]
  outflow: number;         // Tasa de salida admitida por el Gateway w_k * d_k [paq/s]
  spatialQ: number[];      // Perfil espacial discretizado q_{ki}(t, x) en la línea PDE (M nodos en x ∈ [0, 1])
  droppedPackets: number;  // Total acumulado de paquetes descartados en este nodo
  admittedPackets: number; // Total acumulado de paquetes admitidos en este nodo
  bandwidthSavedKB: number; // Ahorro acumulado de ancho de banda [kB] por consolidación JSON (~24.7%)
}

/**
 * Estado dinámico del Servidor Central receptor (ecuación de balance ODE multirretardo y métricas de cola).
 */
export interface CentralServerState {
  buffer: number;          // Estado actual del búfer central z(t) [paquetes]
  bufferKB: number;        // Estado actual del búfer central z(t) [kB] (paquetes * 119 / 1000)
  bufferCapacity: number;  // Capacidad física límite del servidor Z_max [paquetes] (120 paq = ~14.28 kB)
  epsilon: number;         // Capacidad máxima asintótica de procesamiento \varepsilon [paq/s]
  epsilonKBS: number;      // Capacidad máxima asintótica \varepsilon [kB/s]
  w: number;               // Promedio ponderado del factor de admisión efectivo \bar{w}(t) ∈ [0, 1]
  u: number;               // Fracción agregada de enrutamiento/recirculación u = \sum_{k=1}^N u_{ki} ∈ [0, 1)
  weightedDemand: number;  // Suma ponderada de demanda admitida: \sum_{k=1}^N w_k d_k [paq/s]
  weightedRouting: number; // Suma ponderada de enrutamiento efectivo: \sum_{k=1}^N w_k u_{ki} (adimensional)
  inflow: number;          // Flujo total que arriba desde las líneas PDE \sum q_{ki}(t, 1) [paq/s]
  inflowKBS: number;       // Flujo total entrante al servidor [kB/s]
  processingRate: number;  // Tasa instantánea no lineal de procesamiento r(z) = \varepsilon z / (1 + z) [paq/s]
  processingRateKBS: number; // Tasa instantánea de procesamiento r(z) [kB/s]
  zEquilibrium: number;    // Equilibrio analítico por suma ponderada: z* = (\sum w_k d_k) / [(1 - \sum w_k u_{ki})\varepsilon - \sum w_k d_k]
  isEquilibriumFinite: boolean; // Indica si se cumple \sum w_k d_k < (1 - \sum w_k u_{ki})\varepsilon
  totalAdmitted: number;   // Total histórico de paquetes admitidos por el servidor
  totalProcessed: number;  // Total histórico de paquetes procesados y evacuados
  totalDropped: number;    // Total histórico de paquetes perdidos por desborde (buffer overflow)
  totalDroppedKB: number;  // Volumen total de datos perdidos por desborde [kB]
  isBottleneck: boolean;   // Indica si el servidor se encuentra en estado crítico de cuello de botella
  cpuUtilization: number;  // Porcentaje de utilización de la capacidad del servidor (r(z) / \varepsilon * 100)
  queueDelay: number;      // Estimación del tiempo de residencia/latencia en cola [ms]
  totalBandwidthSavingsPercent: number; // Porcentaje de ahorro de ancho de banda por empaquetado (~24.7%)
}

/**
 * Estado global completo del motor de simulación acoplado PDE-ODE en un instante t.
 */
export interface SimulationState {
  time: number;            // Tiempo continuo de simulación t [s]
  mode: SimulationMode;    // Modo de control activo ('optimized' vs 'unoptimized')
  numGateways: number;     // Número de Gateways / líneas de transmisión activas N ∈ {1, 2, 3, 4}
  lambda: number;          // Velocidad efectiva de propagación en las líneas PDE \lambda [s⁻¹]
  tau: number;             // Retardo físico de propagación en la línea \tau = 1 / \lambda [s]
  serverEpsilon: number;   // Capacidad asintótica configurada para el servidor \varepsilon [paq/s]
  gateways: GatewayNodeState[]; // Arreglo de estados de los N Gateways y sus líneas PDE
  server: CentralServerState;   // Estado del Servidor Central
  particles: PacketParticle[];  // Partículas visuales en tránsito por las líneas PDE
  history: {
    time: number;            // Instante registrado [s]
    buffer: number;          // Ocupación del búfer z(t) [paq]
    bufferKB: number;        // Ocupación del búfer z(t) [kB]
    zEquilibrium: number;    // Equilibrio teórico instantáneo z* [paq]
    inflow: number;          // Flujo entrante al servidor \sum q_{ki}(t, 1) [paq/s]
    inflowKBS: number;       // Flujo entrante [kB/s]
    processingRate: number;  // Tasa de procesamiento r(z) [paq/s]
    processingRateKBS: number; // Tasa de procesamiento [kB/s]
    droppedRate: number;     // Tasa instantánea de pérdida por desborde [paq/s]
    totalDemand: number;     // Demanda externa agregada d(t) = \sum d_k(t) [paq/s]
    isBottleneck: boolean;   // Indicador de saturación en ese instante
  }[];
}

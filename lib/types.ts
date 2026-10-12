export type SimulationMode = 'unoptimized' | 'optimized';

export type WeatherPreset = 'dry' | 'moderate' | 'torrential' | 'extreme_flood';

export interface EnvironmentalState {
  rainIntensity: number; // mm/h [0 - 180]
  waterSpeed: number;    // m/s [0.2 - 12.0]
  waterTemp: number;     // °C [18 - 45]
}

export interface SensorTelemetry {
  waterSpeed: number;    // m/s
  waterFlow: number;     // m³/s (speed * cross-section)
  waterTemp: number;     // °C
  generationRate: number; // Packets/sec generated
  bytesRate: number;      // kB/s generated
  rawSensorBytes: number; // ~20 bytes per reading
}

export interface PacketParticle {
  id: number;
  gatewayIndex: number;
  x: number; // Normalized position [0, 1]
  type: 'speed' | 'temp' | 'unified';
  size: number;
}

export interface GatewayNodeState {
  id: string;
  name: string;
  location: string;
  environment: EnvironmentalState;
  sensors: {
    speedSensor: SensorTelemetry;
    tempSensor: SensorTelemetry;
  };
  buffer: number;          // z_k(t) in packets (each ~119 B)
  bufferCapacity: number;  // Z_max in packets (e.g. 80 paq = ~9.5 kB)
  epsilon: number;         // Processing capacity of gateway in paq/s
  w: number;               // Admission factor w_k(t) in [0, 1]
  u: number;               // Routing fraction u_k(t) in [0, 1]
  demand: number;          // d_k(t) in paq/s
  demandKBS: number;       // d_k(t) in kB/s
  outflow: number;         // r_k(z_k) in paq/s
  spatialQ: number[];      // PDE density profile q(x) along transmission line (M discretizations)
  droppedPackets: number;
  admittedPackets: number;
  bandwidthSavedKB: number; // Cumulative kB saved via 25% gateway consolidation
}

export interface CentralServerState {
  buffer: number;          // z_server(t) in packets
  bufferKB: number;        // z_server(t) in kB (buffer * 119 / 1000)
  bufferCapacity: number;  // Z_max in packets (e.g. 120 paq = ~14.3 kB)
  epsilon: number;         // Processing limit \epsilon_server in paq/s
  epsilonKBS: number;      // \epsilon_server in kB/s
  w: number;               // Server admission factor
  inflow: number;          // \sum q_ki(t, 1) in paq/s
  inflowKBS: number;       // in kB/s
  processingRate: number;  // r(z) in paq/s
  processingRateKBS: number; // r(z) in kB/s
  zEquilibrium: number;    // z* theoretical equilibrium in paq
  isEquilibriumFinite: boolean;
  totalAdmitted: number;   // total packets
  totalProcessed: number;  // total packets
  totalDropped: number;    // total packets
  totalDroppedKB: number;  // total dropped in kB
  isBottleneck: boolean;
  cpuUtilization: number;  // percentage r(z) / epsilon * 100
  queueDelay: number;      // ms estimate
  totalBandwidthSavingsPercent: number; // ~25%
}

export interface SimulationState {
  time: number;
  mode: SimulationMode;
  numGateways: number;
  lambda: number;          // Propagation speed \lambda (delay \tau = 1/\lambda)
  tau: number;             // Delay \tau
  serverEpsilon: number;   // Configurable processing capacity in paq/s
  gateways: GatewayNodeState[];
  server: CentralServerState;
  particles: PacketParticle[];
  history: {
    time: number;
    buffer: number;        // packets
    bufferKB: number;      // kB
    zEquilibrium: number;  // packets
    inflow: number;        // paq/s
    inflowKBS: number;     // kB/s
    processingRate: number; // paq/s
    processingRateKBS: number; // kB/s
    droppedRate: number;   // paq/s
    totalDemand: number;   // paq/s
    isBottleneck: boolean;
  }[];
}

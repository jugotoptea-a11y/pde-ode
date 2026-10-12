export type SimulationMode = 'unoptimized' | 'optimized';

export type WeatherPreset = 'dry' | 'moderate' | 'torrential' | 'extreme_flood';

export interface EnvironmentalState {
  rainIntensity: number; // mm/h [0 - 180]
  waterSpeed: number;    // m/s [0.2 - 12.0]
  waterTemp: number;     // °C [18 - 45]
}

export interface SensorTelemetry {
  waterSpeed: number;    // m/s
  waterFlow: number;     // m³/s (approx derived: speed * cross-section)
  waterTemp: number;     // °C
  generationRate: number; // Packets/sec or Mb/s generated
}

export interface PacketParticle {
  id: number;
  gatewayIndex: number;
  x: number; // Normalized position [0, 1]
  type: 'speed' | 'temp' | 'aggregate';
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
  buffer: number;          // z_k(t)
  bufferCapacity: number;  // Z_max
  epsilon: number;         // Processing capacity of gateway
  w: number;               // Admission factor w_k(t) in [0, 1]
  u: number;               // Routing fraction u_k(t) in [0, 1]
  demand: number;          // d_k(t) total incoming data rate
  outflow: number;         // r_k(z_k)
  spatialQ: number[];      // PDE density profile q(x) along transmission line (M discretizations)
  droppedPackets: number;
  admittedPackets: number;
}

export interface CentralServerState {
  buffer: number;          // z_server(t)
  bufferCapacity: number;  // Z_max
  epsilon: number;         // Processing limit \epsilon_server
  w: number;               // Server admission factor
  inflow: number;          // \sum q_ki(t, 1)
  processingRate: number;  // r(z) = \epsilon * z / (1 + z)
  zEquilibrium: number;    // z* computed theoretical equilibrium
  isEquilibriumFinite: boolean;
  totalAdmitted: number;
  totalProcessed: number;
  totalDropped: number;
  isBottleneck: boolean;
  cpuUtilization: number;  // percentage r(z) / epsilon * 100
  queueDelay: number;      // ms estimate
}

export interface SimulationState {
  time: number;
  mode: SimulationMode;
  numGateways: number;
  lambda: number;          // Propagation speed \lambda (delay \tau = 1/\lambda)
  tau: number;             // Delay \tau
  serverEpsilon: number;   // Configurable processing capacity
  gateways: GatewayNodeState[];
  server: CentralServerState;
  particles: PacketParticle[];
  history: {
    time: number;
    buffer: number;
    zEquilibrium: number;
    inflow: number;
    processingRate: number;
    droppedRate: number;
    totalDemand: number;
    isBottleneck: boolean;
  }[];
}

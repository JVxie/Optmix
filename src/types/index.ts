export interface Indicator {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
}

export interface Material {
  id: string;
  name: string;
  price: number; // Price per ton
  indicatorValues: Record<string, number>; // Maps indicator ID to value
}

export interface OptimizationResult {
  success: boolean;
  cost: number;
  ratios: Record<string, number>; // Material ID -> Percentage (0-100)
  message?: string;
  isOptimal?: boolean; // true = 最优解, false = 近似解
}

export interface Scenario {
  id: string;
  name: string;
  indicators: Indicator[];
  materials: Material[];
  // Added for persistence
  savedManualRatios?: Record<string, number>;
  savedOptimizationResult?: OptimizationResult | null;
}

export type ViewMode = 'configuration' | 'calculation';
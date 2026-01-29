
import { Indicator, Material, OptimizationResult } from '../types';
// Use the library from importmap
import solver from 'javascript-lp-solver';

export const calculateOptimalMix = (
  materials: Material[],
  indicators: Indicator[]
): OptimizationResult => {
  if (materials.length === 0) {
    return { success: false, cost: 0, ratios: {}, message: "请先添加货物。" };
  }
  if (indicators.length === 0) {
    return { success: false, cost: 0, ratios: {}, message: "请先添加指标。" };
  }

  // Model structure for javascript-lp-solver
  // See: https://github.com/JWally/jsLPSolver
  const model = {
    optimize: "cost",
    opType: "min",
    constraints: {
      totalPercent: { equal: 100 },
    } as Record<string, any>,
    variables: {} as Record<string, any>,
  };

  // 1. Add Indicator Constraints
  indicators.forEach((ind) => {
    // Logic: Sum(Material_Weight * Indicator_Value) must be within [Min * Total_Weight, Max * Total_Weight]
    // Since Total_Weight is constrained to 100, the constraint is value * 100.
    model.constraints[`ind_${ind.id}_min`] = { min: ind.min * 100 };
    model.constraints[`ind_${ind.id}_max`] = { max: ind.max * 100 };
  });

  // 2. Define Variables (Materials)
  materials.forEach((mat) => {
    // javascript-lp-solver handles variable definitions where keys are constraint names
    const variable: Record<string, number> = {
      cost: mat.price,
      totalPercent: 1, // Contributes 1 unit to the total percentage sum (which must equal 100)
    };

    // Add indicator contributions for this material
    indicators.forEach((ind) => {
      const val = mat.indicatorValues[ind.id] || 0;
      // The variable contributes 'val' to the sum for this indicator constraint
      variable[`ind_${ind.id}_min`] = val;
      variable[`ind_${ind.id}_max`] = val;
    });

    // Use safe ID as key
    model.variables[mat.id] = variable;
  });

  try {
    // Cast to any because the CDN module doesn't provide TS types automatically
    const result = (solver as any).Solve(model);

    if (!result.feasible) {
      return {
        success: false,
        cost: 0,
        ratios: {},
        message: "无法找到满足所有条件的解。请尝试放宽指标范围或增加更多种类的货物。",
      };
    }

    const ratios: Record<string, number> = {};
    
    // Extract results. The solver returns keys matching variable names.
    materials.forEach(m => {
        // javascript-lp-solver might omit variables that are 0, or return them.
        const val = result[m.id] || 0;
        // Round to 2 decimal places
        ratios[m.id] = Math.round(val * 100) / 100;
    });

    // Calculate cost based on rounded ratios to ensure consistency
    // Alternatively, use result.result / 100 and round it. 
    // Let's use result.result / 100 and round it for simplicity.
    const finalCost = Math.round((result.result / 100) * 100) / 100;

    return {
      success: true,
      cost: finalCost, 
      ratios: ratios, 
      message: "计算成功",
    };

  } catch (e) {
    console.error("Solver error:", e);
    return {
      success: false,
      cost: 0,
      ratios: {},
      message: "计算过程发生错误。",
    };
  }
};

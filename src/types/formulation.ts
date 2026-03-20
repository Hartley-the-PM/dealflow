export type FormulationType = 'blend' | 'recipe';

export interface FormulationIngredient {
  id: string;
  productId: string; // references catalog product, or empty for additives
  productName: string; // for display / free-text additives
  percentage: number; // must total 100 across all ingredients
  role?: string; // e.g. 'Base Polymer', 'Additive', 'Colorant', 'Filler', 'Stabilizer'
  notes: string;
}

export interface Formulation {
  id: string;
  name: string; // e.g. 'Custom HDPE Blend V2'
  code: string; // e.g. 'VLT-FM-001'
  type: FormulationType;
  family: string; // e.g. 'PE'
  productType: string; // e.g. 'HDPE'
  ingredients: FormulationIngredient[];
  // Auto-calculated TDS (weighted average)
  calculatedTds?: {
    density?: number;
    meltFlowIndex?: string;
    tensileStrength?: number;
    elongationAtBreak?: number;
    flexuralModulus?: number;
  };
  // Manual overrides for TDS values
  tdsOverrides?: Record<string, string | number>;
  // Recycled content (calculated from ingredients)
  recycledContent?: {
    totalPercent: number;
    pcrPercent: number;
    pirPercent: number;
  };
  description?: string;
  benefits?: string[];
  technicalNotes?: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

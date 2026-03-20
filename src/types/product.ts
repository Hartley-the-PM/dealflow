export interface ProductTDS {
  // General
  grade: string;
  form: string;
  color: string;
  supplier: string;
  supplierLogo?: string; // URL or path to supplier logo
  // Mechanical
  density: string;          // e.g. "0.923 g/cm³"
  meltFlowIndex: string;    // e.g. "2.0 g/10 min (190°C/2.16 kg)"
  tensileStrength: string;  // e.g. "22 MPa"
  elongationAtBreak: string;// e.g. "600%"
  flexuralModulus: string;  // e.g. "250 MPa"
  impactStrength?: string;  // e.g. "No break (Charpy, 23°C)"
  // Thermal
  vicatSofteningTemp: string; // e.g. "95°C"
  heatDeflectionTemp?: string;// e.g. "52°C (0.45 MPa)"
  meltingPoint?: string;      // e.g. "112°C"
  shoreHardness?: string;     // e.g. "D55"
  // Applications & Compliance
  applications: string[];     // e.g. ["Film", "Packaging", "Lamination"]
  compliance: string[];       // e.g. ["FDA", "EU 10/2011", "REACH"]
  processingMethods?: string[];// e.g. ["Blown film", "Cast film", "Extrusion coating"]
}

export interface Product {
  id: string;
  name: string;
  legacyName: string;
  code: string;
  productType: string; // e.g. 'LDPE', 'HDPE', 'PP', 'PVC', 'PS', 'PET'
  tds?: ProductTDS;

  // New classification fields
  materialType?: 'Chemical' | 'Elastomer' | 'Polymer';
  sourceType?: 'Branded Prime' | 'Generic Prime' | 'Recycled';
  family?: string; // e.g. 'PE', 'PP', 'PVC', 'PS', 'PET'

  // Recycled specs (only when sourceType === 'Recycled')
  recycledSpecs?: {
    pcrPercent: number; // Post-Consumer Recycled %
    pirPercent: number; // Post-Industrial Recycled %
    virginPercent: number; // Virgin content %
    certifications?: string[]; // e.g. ['ISCC PLUS', 'GRS']
  };

  // White label link (only for Generic Prime products)
  whiteLabel?: {
    brandId: string; // references a WL brand profile
    linkedProductIds: string[]; // products this WL is based on
  };

  // Formulation link (only for formulated products)
  formulation?: {
    formulationId: string; // references a Formulation record
  };
}

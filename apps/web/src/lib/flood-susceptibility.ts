export interface SusceptibilityClass {
  dn: number;
  label: string;
  color: string;
  range: string;
  description: string;
}

export const SUSCEPTIBILITY_CLASSES: Record<number, SusceptibilityClass> = {
  1: {
    dn: 1,
    label: "Very Low",
    color: "#1a9641",
    range: "0–25%",
    description: "Minimal inundation probability. Typically elevated or well-drained areas.",
  },
  2: {
    dn: 2,
    label: "Low",
    color: "#ffffb2",
    range: "25–50%",
    description: "Low inundation probability. Minor risk during extreme rainfall events.",
  },
  3: {
    dn: 3,
    label: "Moderate",
    color: "#fd8d3c",
    range: "50–75%",
    description: "Moderate risk. At risk during moderate-to-heavy rainfall.",
  },
  4: {
    dn: 4,
    label: "High",
    color: "#d7191c",
    range: "75–100%",
    description: "High probability. Prone to flooding during significant storm events.",
  },
};

export const ALL_CLASSES = [1, 2, 3, 4] as const;

export const SOURCE_LABEL = "Ensemble RF + XGBoost (Avena et al., 2026)";
export const ENSEMBLE_SHORT = "RF + XGBoost Ensemble";
export const FOOTER_TEXT = "Avena et al., 2026 · OpenStreetMap";

export const DEFAULT_OPACITY = 0.65;

export const CLASS_ORDER_DESC = [4, 3, 2, 1] as const;

export const CHUNK_SIZE = 500;
export const CHUNK_DELAY_MS = 0;
export const LOD_BREAKPOINT = 12;

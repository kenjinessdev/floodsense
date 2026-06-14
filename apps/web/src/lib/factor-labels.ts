import type { ExtractedValues } from "@/lib/api";

export const FACTOR_LABELS: Record<keyof ExtractedValues, string> = {
    Elevation: "Elevation",
    Rainfall: "Rainfall",
    Slope: "Slope",
    Profile_Curvature: "Profile Curvature",
    LULC: "Land Use / Land Cover",
    Lithology: "Lithology",
    Distance_to_River: "Distance to River",
    Aspect: "Aspect",
};

export const FACTOR_ORDER: (keyof ExtractedValues)[] = [
    "Elevation",
    "Rainfall",
    "Slope",
    "Profile_Curvature",
    "LULC",
    "Lithology",
    "Distance_to_River",
    "Aspect",
];

const CATEGORICAL_FACTORS = new Set<keyof ExtractedValues>([
    "LULC",
    "Lithology",
]);

const UNIT_MAP: Record<keyof ExtractedValues, string> = {
    Elevation: "m",
    Rainfall: "mm",
    Slope: "\u00B0",
    Profile_Curvature: "",
    LULC: "",
    Lithology: "",
    Distance_to_River: "m",
    Aspect: "rad",
};

const SUPERSCRIPT_MAP: Record<string, string> = {
    "-": "\u207B",
    "0": "\u2070",
    "1": "\u00B9",
    "2": "\u00B2",
    "3": "\u00B3",
    "4": "\u2074",
    "5": "\u2075",
    "6": "\u2076",
    "7": "\u2077",
    "8": "\u2078",
    "9": "\u2079",
};

function toScientificNotation(value: number): string {
    if (value === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exp);
    const superscript = String(exp)
        .split("")
        .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
        .join("");
    return `${mantissa.toFixed(2)} \u00D7 10${superscript}`;
}

export function formatFactorValue(
    key: keyof ExtractedValues,
    value: number,
): string {
    if (key === "Profile_Curvature") {
        return toScientificNotation(value);
    }
    if (CATEGORICAL_FACTORS.has(key)) {
        return String(Math.round(value));
    }
    const unit = UNIT_MAP[key];
    const formatted = value.toFixed(2);
    if (unit) return `${formatted} ${unit}`;
    return formatted;
}

export function isCategorical(key: keyof ExtractedValues): boolean {
    return CATEGORICAL_FACTORS.has(key);
}

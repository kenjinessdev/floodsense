export type RiskLevel = "Very Low" | "Low" | "Moderate" | "High";

export function riskLevelFromProbability(probability: number): RiskLevel {
    if (probability >= 0.8) return "High";
    if (probability >= 0.5) return "Moderate";
    if (probability >= 0.3) return "Low";
    return "Very Low";
}

const SOLID_BG: Record<RiskLevel, string> = {
    "Very Low": "bg-emerald-600",
    Low: "bg-amber-500",
    Moderate: "bg-red-500",
    High: "bg-rose-600",
};

const TINTED: Record<RiskLevel, string> = {
    "Very Low":
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Low: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Moderate:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    High: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

export function riskColorFromProbability(probability: number): string {
    return SOLID_BG[riskLevelFromProbability(probability)];
}

export function riskTintClasses(probability: number): string {
    return TINTED[riskLevelFromProbability(probability)];
}

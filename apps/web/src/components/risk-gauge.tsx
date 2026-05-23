/**
 * Risk Gauge Component - Visual display of flood susceptibility risk level
 */

import { AlertTriangle } from "lucide-react";

interface RiskGaugeProps {
    probability: number;
    riskLevel: string;
    riskColor: string;
    label: string;
    override: boolean;
    overrideReason: string | null;
}

export function RiskGauge({
    probability,
    riskLevel,
    riskColor,
    label,
    override,
    overrideReason,
}: RiskGaugeProps) {
    const percentage = Math.round(probability * 100);

    const getTextColorClass = () => {
        if (probability < 0.25) return "text-emerald-600 dark:text-emerald-400";
        if (probability < 0.5) return "text-amber-600 dark:text-amber-400";
        if (probability < 0.75) return "text-orange-600 dark:text-orange-400";
        return "text-red-600 dark:text-red-400";
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Percentage Display */}
            <div className="text-center py-4">
                <div
                    className={`text-6xl font-extrabold tracking-tight ${getTextColorClass()}`}
                >
                    {percentage}%
                </div>
                <div className="text-sm text-muted-foreground mt-2 font-medium">
                    Flood Probability
                </div>
            </div>

            {/* Risk Level Badge */}
            <div
                className="px-8 py-3 rounded-full font-semibold text-base text-white shadow-lg"
                style={{
                    backgroundColor: riskColor,
                    boxShadow: `0 4px 14px ${riskColor}55`,
                }}
            >
                {riskLevel} &middot; {label}
            </div>

            {override && overrideReason && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-center">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />Override applied: {overrideReason}
                </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs mt-2 w-full">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium">Low (0–25%)</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-medium">Moderate (25–50%)</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span className="font-medium">High (50–75%)</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="font-medium">Very High (75–100%)</span>
                </div>
            </div>
        </div>
    );
}

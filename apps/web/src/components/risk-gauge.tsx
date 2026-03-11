/**
 * Risk Gauge Component - Visual display of flood susceptibility risk level
 */

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
                <div className={`text-6xl font-bold ${getTextColorClass()}`}>
                    {percentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Flood Probability
                </div>
            </div>

            {/* Risk Level Badge */}
            <div
                className="px-8 py-3 rounded-full border-2 font-semibold text-lg text-white"
                style={{ backgroundColor: riskColor, borderColor: riskColor }}
            >
                {riskLevel} — {label}
            </div>

            {override && overrideReason && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-center">
                    ⚠️ Override applied: {overrideReason}
                </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Low (0–25%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Moderate (25–50%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>High (50–75%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Very High (75–100%)</span>
                </div>
            </div>
        </div>
    );
}

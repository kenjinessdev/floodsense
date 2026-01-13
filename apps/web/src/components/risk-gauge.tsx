/**
 * Risk Gauge Component - Visual display of flood susceptibility risk level
 */

interface RiskGaugeProps {
    probability: number; // 0-1
    riskLevel: "Low" | "Moderate" | "High" | "Very High";
    confidence: number; // 0-1
}

export function RiskGauge({
    probability,
    riskLevel,
    confidence,
}: RiskGaugeProps) {
    const percentage = Math.round(probability * 100);
    const confidencePercentage = Math.round(confidence * 100);

    const getRiskColor = () => {
        switch (riskLevel) {
            case "Low":
                return "text-emerald-700 dark:text-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-900/50";
            case "Moderate":
                return "text-amber-700 dark:text-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-900/50";
            case "High":
                return "text-orange-700 dark:text-orange-400 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-900/50";
            case "Very High":
                return "text-red-700 dark:text-red-400 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-900/50";
        }
    };

    const getGaugeColor = () => {
        switch (riskLevel) {
            case "Low":
                return "stroke-emerald-500 dark:stroke-emerald-400";
            case "Moderate":
                return "stroke-amber-500 dark:stroke-amber-400";
            case "High":
                return "stroke-orange-500 dark:stroke-orange-400";
            case "Very High":
                return "stroke-red-500 dark:stroke-red-400";
        }
    };

    const getGaugeFill = () => {
        if (probability < 0.25) return "text-emerald-600 dark:text-emerald-400";
        if (probability < 0.5) return "text-amber-600 dark:text-amber-400";
        if (probability < 0.75) return "text-orange-600 dark:text-orange-400";
        return "text-red-600 dark:text-red-400";
    };

    // Calculate arc path for gauge
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference * 0.75; // 270 degrees
    const offset = circumference - arcLength * probability;

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Percentage Display */}
            <div className="text-center py-4">
                <div className={`text-6xl font-bold ${getGaugeFill()}`}>
                    {percentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Susceptibility
                </div>
            </div>

            {/* Risk Level Badge */}
            <div
                className={`px-8 py-3 rounded-full border-2 font-semibold text-lg ${getRiskColor()}`}
            >
                {riskLevel} Risk
            </div>

            {/* Confidence Score */}
            <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">
                    Model Confidence
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-32">
                        <div
                            className="h-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${confidencePercentage}%` }}
                        />
                    </div>
                    <span className="text-sm font-medium">
                        {confidencePercentage}%
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Low (0-25%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Moderate (25-50%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>High (50-75%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Very High (75-100%)</span>
                </div>
            </div>
        </div>
    );
}

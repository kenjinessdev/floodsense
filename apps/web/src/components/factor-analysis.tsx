/**
 * Factor Analysis Component - Display conditioning factor breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const LULC_LABELS: Record<number, string> = {
    10: "Cropland (Rainfed)",
    20: "Cropland (Irrigated)",
    30: "Cropland/Vegetation Mix",
    40: "Natural Vegetation Mix",
    50: "Broadleaf Forest (Evergreen)",
    60: "Broadleaf Forest (Deciduous)",
    80: "Grassland",
    100: "Woodland/Shrub Mix",
    110: "Herbaceous Cover",
    120: "Shrubland",
    130: "Grassland",
    160: "Flooded Forest",
    170: "Mangrove",
    190: "Urban/Built-up",
    200: "Barren Land",
    210: "Water Body",
};

const LITHOLOGY_LABELS: Record<number, string> = {
    1: "Alluvial Deposits",
    2: "Volcanic Rocks",
    3: "Sedimentary Rocks",
    4: "Limestone",
    5: "Ultramafic Rocks",
    6: "Metamorphic Rocks",
};

interface ExtractedValues {
    Elevation: number;
    Rainfall: number;
    Slope: number;
    Profile_Curvature: number;
    LULC: number;
    Lithology: number;
    Distance_to_River: number;
    Aspect: number;
}

interface FactorAnalysisProps {
    extractedValues: ExtractedValues;
}

export function FactorAnalysis({ extractedValues: ev }: FactorAnalysisProps) {
    const lulcCode = Math.round(ev.LULC);
    const lithCode = Math.round(ev.Lithology);
    const rainfallMm = ev.Rainfall * 1000; // convert m/year → mm/year

    return (
        <div className="space-y-6">
            {/* All Conditioning Factors */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        📊 All Conditioning Factors
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FactorItem
                            label="Elevation"
                            value={`${Math.round(ev.Elevation)}m`}
                            icon="⬆️"
                            description="Height above sea level"
                        />
                        <FactorItem
                            label="Slope Gradient"
                            value={`${ev.Slope.toFixed(2)}°`}
                            icon="📐"
                            description="Terrain inclination"
                        />
                        <FactorItem
                            label="Aspect"
                            value={`${ev.Aspect.toFixed(2)}°`}
                            icon="🧭"
                            description="Direction of slope"
                        />
                        <FactorItem
                            label="Profile Curvature"
                            value={ev.Profile_Curvature.toExponential(3)}
                            icon="🏞️"
                            description="Terrain concavity/convexity"
                        />
                        <FactorItem
                            label="Distance to River"
                            value={`${Math.round(ev.Distance_to_River)}m`}
                            icon="🌊"
                            description="Proximity to waterways"
                        />
                        <FactorItem
                            label="Annual Rainfall"
                            value={`${Math.round(rainfallMm)}mm`}
                            icon="🌧️"
                            description="Regional precipitation"
                        />
                        <FactorItem
                            label="Land Use"
                            value={LULC_LABELS[lulcCode] ?? `Class ${lulcCode}`}
                            icon="🏢"
                            description="LULC classification"
                        />
                        <FactorItem
                            label="Lithology"
                            value={
                                LITHOLOGY_LABELS[lithCode] ?? `Type ${lithCode}`
                            }
                            icon="🪨"
                            description="Geological composition"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Context Note */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div className="flex-1">
                            <h4 className="font-semibold mb-1 text-blue-900">
                                Regional Context
                            </h4>
                            <p className="text-sm text-blue-800">
                                This analysis uses offline susceptibility data
                                from the Davao City flood study. Rainfall data
                                is sourced from Mindanao regional patterns. This
                                is{" "}
                                <strong>
                                    not a real-time weather forecast
                                </strong>
                                , but a risk assessment based on terrain and
                                climatological factors.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function FactorItem({
    label,
    value,
    icon,
    description,
}: {
    label: string;
    value: string;
    icon: string;
    description: string;
}) {
    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="font-medium text-sm">{label}</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-1">
                {value}
            </div>
            <div className="text-xs text-gray-600">{description}</div>
        </div>
    );
}

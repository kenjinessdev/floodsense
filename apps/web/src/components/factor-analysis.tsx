/**
 * Factor Analysis Component - Display conditioning factor breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Factor {
    factor: string;
    value: number;
    risk: "Low" | "Moderate" | "High" | "Critical";
    message: string;
    icon: string;
}

interface GeoFactors {
    elevation: number;
    slope: number;
    aspect: number;
    profileCurvature: number;
    distanceToRiver: number;
    rainfall: number;
    landUseClass: string;
    lithology: string;
}

interface FactorAnalysisProps {
    factors: GeoFactors;
    importanceList: Factor[];
}

export function FactorAnalysis({
    factors,
    importanceList,
}: FactorAnalysisProps) {
    const getRiskBadgeColor = (risk: string) => {
        switch (risk) {
            case "Critical":
                return "bg-red-100 text-red-800 border-red-300";
            case "High":
                return "bg-orange-100 text-orange-800 border-orange-300";
            case "Moderate":
                return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "Low":
                return "bg-green-100 text-green-800 border-green-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

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
                            value={`${Math.round(factors.elevation)}m`}
                            icon="⬆️"
                            description="Height above sea level"
                        />
                        <FactorItem
                            label="Slope Gradient"
                            value={`${factors.slope.toFixed(1)}°`}
                            icon="📐"
                            description="Terrain inclination"
                        />
                        <FactorItem
                            label="Aspect"
                            value={`${Math.round(factors.aspect)}°`}
                            icon="🧭"
                            description="Direction of slope"
                        />
                        <FactorItem
                            label="Profile Curvature"
                            value={factors.profileCurvature.toFixed(2)}
                            icon="🏞️"
                            description="Terrain concavity/convexity"
                        />
                        <FactorItem
                            label="Distance to River"
                            value={`${Math.round(factors.distanceToRiver)}m`}
                            icon="🌊"
                            description="Proximity to waterways"
                        />
                        <FactorItem
                            label="Annual Rainfall"
                            value={`${Math.round(factors.rainfall)}mm`}
                            icon="🌧️"
                            description="Regional precipitation"
                        />
                        <FactorItem
                            label="Land Use"
                            value={factors.landUseClass}
                            icon="🏢"
                            description="LULC classification"
                        />
                        <FactorItem
                            label="Lithology"
                            value={factors.lithology}
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

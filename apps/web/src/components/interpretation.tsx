import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText } from "lucide-react";

interface InterpretationProps {
    riskLevel: string;
    probability: number;
}

function pillColorForRisk(riskLevel: string): string {
    switch (riskLevel) {
        case "Very High":
            return "#dc2626";
        case "High":
            return "#ef4444";
        case "Moderate":
            return "#f59e0b";
        case "Low":
            return "#10b981";
        case "Very Low":
            return "#10b981";
        default:
            return "#6b7280";
    }
}

function susceptibilityPhrase(riskLevel: string): string {
    switch (riskLevel) {
        case "Very High":
            return "very high susceptibility to flooding";
        case "High":
            return "high susceptibility to flooding";
        case "Moderate":
            return "moderate susceptibility to flooding";
        default:
            return "low susceptibility to flooding";
    }
}

function renderDetail(riskLevel: string) {
    if (riskLevel === "Very High") {
        return (
            <>
                The terrain and environmental factors in this area indicate that
                flooding is likely during significant rainfall events. This area
                requires <strong>careful planning and flood mitigation measures</strong>.
            </>
        );
    }
    if (riskLevel === "High") {
        return (
            <>
                The characteristics of this area             suggest elevated flood susceptibility.{" "}
                <strong>Consider this when planning construction</strong> or
                infrastructure improvements.
            </>
        );
    }
    if (riskLevel === "Moderate") {
        return (
            <>
                While not the highest susceptibility, this area may still experience
                flooding during extreme weather events.{" "}
                <strong>Standard precautionary measures are recommended</strong>.
            </>
        );
    }
    return (
        <>
            Based on the surrounding terrain and environmental factors, this area
            is <strong>relatively safe from flooding</strong> under normal
            conditions. Always remain aware of extreme weather warnings.
        </>
    );
}

export function Interpretation({ riskLevel }: InterpretationProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Interpretation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                    <span
                        className="inline-block px-3 py-1 rounded-full text-white text-base font-semibold"
                        style={{
                            backgroundColor: pillColorForRisk(riskLevel),
                        }}
                    >
                        {riskLevel}
                    </span>
                </div>

                <p className="font-medium text-base text-foreground">
                    This location has a{" "}
                    <strong>{susceptibilityPhrase(riskLevel)}</strong>.
                </p>

                <p>{renderDetail(riskLevel)}</p>

                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    This interpretation is based on the{" "}
                    <strong>ensemble model's assessment</strong> of terrain and
                    environmental conditioning factors.
                </p>
            </CardContent>
        </Card>
    );
}

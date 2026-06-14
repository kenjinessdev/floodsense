import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText } from "lucide-react";
import { riskTintClasses } from "@/lib/risk-color";

interface InterpretationProps {
    riskLevel: string;
    probability: number;
}

function susceptibilityPhrase(riskLevel: string): string {
    switch (riskLevel) {
        case "High":
            return "high susceptibility to flooding";
        case "Moderate":
            return "moderate susceptibility to flooding";
        case "Low":
            return "low susceptibility to flooding";
        default:
            return "very low susceptibility to flooding";
    }
}

function renderDetail(riskLevel: string) {
    if (riskLevel === "High") {
        return (
            <>
                The terrain and environmental factors in this area indicate that
                flooding is likely during significant rainfall events. This area
                requires <strong>careful planning and flood mitigation measures</strong>.
            </>
        );
    }
    if (riskLevel === "Moderate") {
        return (
            <>
                The characteristics of this area suggest elevated flood susceptibility.{" "}
                <strong>Consider this when planning construction</strong> or
                infrastructure improvements.
            </>
        );
    }
    if (riskLevel === "Low") {
        return (
            <>
                While not the lowest susceptibility, this area may still experience
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

export function Interpretation({ riskLevel, probability }: InterpretationProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
                    Interpretation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                    <span
                        className={`inline-block px-3 py-1 rounded-full text-base font-semibold ${riskTintClasses(probability)}`}
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

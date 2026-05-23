import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface InterpretationProps {
    riskLevel: string;
    probability: number;
}

function getInterpretation(riskLevel: string, probability: number) {
    const pct = Math.round(probability * 100);

    if (riskLevel === "Very High") {
        return {
            summary: "This location has a very high susceptibility to flooding.",
            detail:
                "The terrain and environmental factors in this area indicate that flooding is likely during significant rainfall events. This area requires careful planning and flood mitigation measures.",
        };
    }
    if (riskLevel === "High") {
        return {
            summary: "This location has a high susceptibility to flooding.",
            detail:
                "The characteristics of this area suggest a elevated flood risk. Consider this when planning construction or infrastructure improvements.",
        };
    }
    if (riskLevel === "Moderate") {
        return {
            summary: "This location has a moderate susceptibility to flooding.",
            detail:
                "While not the highest risk, this area may still experience flooding during extreme weather events. Standard precautionary measures are recommended.",
        };
    }

    return {
        summary:
            "This location has a low susceptibility to flooding.",
        detail:
            "Based on the surrounding terrain and environmental factors, this area is relatively safe from flooding under normal conditions. Always remain aware of extreme weather warnings.",
    };
}

export function Interpretation({ riskLevel, probability }: InterpretationProps) {
    const { summary, detail } = getInterpretation(riskLevel, probability);

    return (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                    📋 Interpretation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p className="font-medium text-base">
                    <span
                        className="inline-block px-2 py-0.5 rounded-full text-white text-sm font-semibold mr-1"
                        style={{
                            backgroundColor:
                                probability < 0.25
                                    ? "#10b981"
                                    : probability < 0.5
                                      ? "#f59e0b"
                                      : probability < 0.75
                                        ? "#f97316"
                                        : "#ef4444",
                        }}
                    >
                        {riskLevel}
                    </span>{" "}
                    {summary}
                </p>
                <p>{detail}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    This interpretation is based on the ensemble model's
                    assessment of terrain and environmental conditioning
                    factors.
                </p>
            </CardContent>
        </Card>
    );
}

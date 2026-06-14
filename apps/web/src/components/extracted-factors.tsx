import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import {
    FACTOR_LABELS,
    FACTOR_ORDER,
    formatFactorValue,
    isCategorical,
} from "@/lib/factor-labels";
import type { ExtractedValues } from "@/lib/api";

interface ExtractedFactorsProps {
    values: ExtractedValues;
}

export function ExtractedFactors({ values }: ExtractedFactorsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Layers aria-hidden="true" className="h-5 w-5 text-primary" />
                    Extracted Conditioning Factors
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FACTOR_ORDER.map((key) => {
                        const raw = values[key];
                        const label = FACTOR_LABELS[key];
                        const formatted = formatFactorValue(key, raw);
                        const categorical = isCategorical(key);
                        const ariaLabel = `${label}: ${formatted}${categorical ? " Class" : ""}`;

                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                                role="group"
                                aria-label={ariaLabel}
                            >
                                <span className="text-xs text-muted-foreground">
                                    {label}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    {categorical && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0 h-4"
                                        >
                                            Class
                                        </Badge>
                                    )}
                                    <span className="text-sm font-semibold tabular-nums">
                                        {formatted}
                                    </span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

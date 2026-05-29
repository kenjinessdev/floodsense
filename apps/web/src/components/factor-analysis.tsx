import { Card, CardContent } from "./ui/card";
import { Info } from "lucide-react";

export function RegionalContext() {
    return (
        <Card className="bg-accent/30 border-primary/20">
            <CardContent className="pt-6">
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold mb-1 text-accent-foreground">
                            Regional Context
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            This analysis uses offline susceptibility data
                            from the Davao City flood study. Rainfall data
                            is sourced from Mindanao regional patterns. This
                            is{" "}
                            <strong>
                                not a real-time weather forecast
                            </strong>
                            , but a flood susceptibility analysis based on terrain and
                            climatological factors.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

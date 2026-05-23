import { Card, CardContent } from "./ui/card";

export function RegionalContext() {
    return (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 shadow-sm">
            <CardContent className="pt-6">
                <div className="flex gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div className="flex-1">
                        <h4 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">
                            Regional Context
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
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
    );
}

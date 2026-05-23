import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Cpu, Building2, Lightbulb, BookOpen, Waves } from "lucide-react";

export const Route = createFileRoute("/about")({
    component: AboutComponent,
});

function AboutComponent() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                About FloodSense
                            </h1>
                            <p className="text-sm md:text-base text-muted-foreground mt-1">
                                Understanding the Technology Behind Flood Risk
                                Assessment
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate({ to: "/" })}
                            variant="outline"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Map
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-6">
                    {/* Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Waves className="h-5 w-5 text-primary" />
                                Davao FloodSense: Ensemble Risk Mapper
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>
                                Davao FloodSense is a web-based flood
                                susceptibility mapping tool specifically
                                designed for Davao City, Mindanao, Philippines.
                                The application uses advanced machine learning
                                techniques to assess flood risk based on terrain
                                characteristics and environmental factors.
                            </p>
                            <p>
                                This tool addresses the critical problem of
                                flash floods in Davao City caused by complex
                                terrain and upstream rainfall patterns,
                                providing valuable insights for planning and
                                risk assessment.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Scope and Limitations */}
                    <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                Important: Scope and Limitations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-amber-900 dark:text-amber-200">
                            <p className="font-semibold">
                                This tool provides susceptibility mapping using
                                offline data, NOT real-time forecasting.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>
                                    Analysis is based on terrain features and
                                    historical rainfall patterns
                                </li>
                                <li>
                                    Results indicate inherent flood
                                    susceptibility, not immediate flood risk
                                </li>
                                <li>
                                    Does not replace official weather forecasts
                                    or flood warnings
                                </li>
                                <li>
                                    Limited to Davao City geographical bounds
                                </li>
                                <li>
                                    Should be used as one factor in
                                    decision-making, not the sole determinant
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Technology Stack */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-primary" />
                                Technical Architecture
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                                        Ensemble Machine Learning
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        The application uses a hybrid ensemble
                                        approach combining two powerful
                                        algorithms:
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                                Random Forest
                                            </h4>
                                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                                <strong>Method:</strong> Bagging
                                                (Bootstrap Aggregating)
                                                <br />
                                                <strong>Trees:</strong> 100
                                                decision trees
                                                <br />
                                                <strong>Strength:</strong>{" "}
                                                Stability and robustness
                                                <br />
                                                <strong>Accuracy:</strong> AUC
                                                0.85
                                            </p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                                                XGBoost
                                            </h4>
                                            <p className="text-xs text-emerald-800 dark:text-emerald-300">
                                                <strong>Method:</strong>{" "}
                                                Gradient Boosting
                                                <br />
                                                <strong>Rounds:</strong> 50
                                                boosting iterations
                                                <br />
                                                <strong>Strength:</strong>{" "}
                                                Precision and accuracy
                                                <br />
                                                <strong>Accuracy:</strong> AUC
                                                0.86
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 p-4 bg-accent/30 rounded-xl border border-primary/20">
                                        <h4 className="font-semibold text-accent-foreground mb-1">
                                            Ensemble (Stacking)
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Combines both models using weighted
                                            averaging to achieve superior
                                            accuracy (AUC 0.87+), outperforming
                                            either model individually.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">
                                        Eight Conditioning Factors
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        {[
                                            { icon: "⬆️", name: "Elevation" },
                                            { icon: "📐", name: "Slope" },
                                            { icon: "🧭", name: "Aspect" },
                                            { icon: "🏞️", name: "Curvature" },
                                            {
                                                icon: "🌊",
                                                name: "Distance to River",
                                            },
                                            { icon: "🌧️", name: "Rainfall" },
                                            { icon: "🏢", name: "Land Use" },
                                            { icon: "🪨", name: "Lithology" },
                                        ].map((factor) => (
                                            <div
                                                key={factor.name}
                                                className="p-3 bg-muted rounded text-center"
                                            >
                                                <div className="text-2xl mb-1">
                                                    {factor.icon}
                                                </div>
                                                <div className="text-xs font-medium">
                                                    {factor.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Class Structure */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Software Architecture
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h4 className="font-semibold text-blue-900 mb-1">
                                        GeoFactor Class
                                    </h4>
                                    <p className="text-xs text-blue-800">
                                        Handles extraction of the eight
                                        conditioning factors. Acts as the
                                        foundation, holding all raw geographical
                                        and environmental data for analysis.
                                    </p>
                                </div>

                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                    <h4 className="font-semibold text-emerald-900 mb-1">
                                        BaseModel Class
                                    </h4>
                                    <p className="text-xs text-emerald-800">
                                        Parent class defining the interface for
                                        machine learning models. Provides common
                                        functionality for training and
                                        prediction.
                                    </p>
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <h4 className="font-semibold text-amber-900 mb-1">
                                        RandomForestModel & XGBoostModel
                                    </h4>
                                    <p className="text-xs text-amber-800">
                                        Subclasses implementing specific
                                        algorithms. Random Forest uses bagging
                                        with majority voting, while XGBoost uses
                                        gradient boosting with error correction.
                                    </p>
                                </div>

                                <div className="rounded-lg border border-primary/30 bg-accent/20 p-4">
                                    <h4 className="font-semibold text-accent-foreground mb-1">
                                        EnsemblePredictor Class
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        The core logic combining Random Forest
                                        and XGBoost predictions using stacking.
                                        Ensures models are trained only on
                                        validated Davao City flood data points.
                                    </p>
                                </div>

                                <p className="text-xs italic mt-4 text-muted-foreground">
                                    <strong>Design Philosophy:</strong> Like a
                                    blueprint for a house - the GeoFactor class
                                    is the foundation with raw materials, while
                                    the EnsemblePredictor is the architect
                                    combining multiple blueprints into one
                                    stronger design. This separation ensures
                                    flexibility and maintainability.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Use Cases */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-primary" />
                                Use Cases
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-3">
                                    <span className="text-2xl">🏘️</span>
                                    <div>
                                        <h4 className="font-semibold mb-1 text-foreground">
                                            Urban Planning
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Identify high-risk zones for
                                            development restrictions or flood
                                            mitigation infrastructure
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-2xl">🏗️</span>
                                    <div>
                                        <h4 className="font-semibold mb-1 text-foreground">
                                            Construction Planning
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Assess flood susceptibility before
                                            selecting building sites or
                                            designing structures
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-2xl">🚨</span>
                                    <div>
                                        <h4 className="font-semibold mb-1 text-foreground">
                                            Emergency Preparedness
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Identify communities at risk for
                                            targeted disaster preparedness
                                            programs
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <h4 className="font-semibold mb-1 text-foreground">
                                            Risk Assessment
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Support insurance underwriting and
                                            property valuation with flood risk
                                            data
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Research Background */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Research Background
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>
                                This application is based on research studying
                                flash floods in Davao City caused by complex
                                terrain and upstream rainfall patterns in the
                                Mindanao region.
                            </p>
                            <p>
                                The study analyzed known flood-prone areas
                                including Matina Pangi, Talomo, and Buhangin,
                                using machine learning to identify patterns in
                                terrain characteristics that correlate with
                                flood susceptibility.
                            </p>
                            <p className="font-semibold mt-3 text-foreground">
                                Key Findings:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>
                                    Distance to river is the most critical
                                    factor in flood susceptibility
                                </li>
                                <li>
                                    Low slope areas (flat terrain) significantly
                                    increase flood risk
                                </li>
                                <li>
                                    Urban built-up areas have higher risk due to
                                    increased surface runoff
                                </li>
                                <li>
                                    Regional rainfall patterns from Mindanao
                                    affect even areas with no local rain
                                </li>
                                <li>
                                    Ensemble methods outperform individual
                                    models in prediction accuracy
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Contact */}
                    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <h3 className="font-semibold text-lg mb-2 text-foreground">
                                    Questions or Feedback?
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This is an academic prototype demonstrating
                                    ensemble machine learning for flood
                                    susceptibility mapping.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Davao FloodSense © 2026 • Built with React
                                    and TypeScript
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

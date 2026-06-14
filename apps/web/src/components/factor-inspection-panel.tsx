import { useEffect, useState, useCallback, useRef } from "react";
import { X, RefreshCw, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FACTOR_LABELS,
    FACTOR_ORDER,
    formatFactorValue,
    isCategorical,
} from "@/lib/factor-labels";
import { predictFloodRisk, type ExtractedValues } from "@/lib/api";

type PanelState = "loading" | "success" | "error";

interface FactorInspectionPanelProps {
    isOpen: boolean;
    location: { lat: number; lng: number } | null;
    onClose: () => void;
}

export function FactorInspectionPanel({
    isOpen,
    location,
    onClose,
}: FactorInspectionPanelProps) {
    const [panelState, setPanelState] = useState<PanelState>("loading");
    const [factorValues, setFactorValues] = useState<ExtractedValues | null>(
        null,
    );
    const [errorMessage, setErrorMessage] = useState("");
    const mapContainerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        mapContainerRef.current = document.querySelector("[data-map-container]") as HTMLElement | null;
    }, []);

    const fetchFactors = useCallback(async (lat: number, lng: number) => {
        setPanelState("loading");
        setFactorValues(null);
        setErrorMessage("");
        try {
            const data = await predictFloodRisk(lat, lng);
            setFactorValues(data.extracted_values);
            setPanelState("success");
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Could not extract values for this location.",
            );
            setPanelState("error");
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !location) return;
        fetchFactors(location.lat, location.lng);
    }, [isOpen, location, fetchFactors]);

    const handleRetry = () => {
        if (!location) return;
        fetchFactors(location.lat, location.lng);
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            mapContainerRef.current?.focus();
        }, 50);
    };

    if (!isOpen) return null;

    const panelContent = (
        <>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h2 className="text-sm font-semibold">Extracted Factors</h2>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleClose}
                    aria-label="Close factor inspection panel"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {panelState === "loading" && <FactorSkeletons />}
                {panelState === "error" && (
                    <ErrorState
                        message={
                            errorMessage ||
                            "Could not extract values for this location."
                        }
                        onRetry={handleRetry}
                    />
                )}
                {panelState === "success" && factorValues && (
                    <FactorRows values={factorValues} />
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop: fixed right panel */}
            <div
                className="hidden md:flex md:w-80 bg-card border-l border-border flex-col shrink-0"
                role="complementary"
                aria-label="Extracted Factors"
            >
                {panelContent}
            </div>

            {/* Mobile: bottom sheet */}
            <MobileBottomSheet onClose={handleClose}>
                {panelContent}
            </MobileBottomSheet>
        </>
    );
}

function MobileBottomSheet({
    children,
    onClose,
}: {
    children: React.ReactNode;
    onClose: () => void;
}) {
    const [dragOffset, setDragOffset] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const dragStartY = useRef(0);
    const dragStartOffset = useRef(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const sheetHeight = useRef(0);

    useEffect(() => {
        if (sheetRef.current) {
            sheetHeight.current = sheetRef.current.scrollHeight;
        }
    }, [children]);

    const handleTouchStart = (e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
        dragStartOffset.current = dragOffset;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const delta = e.touches[0].clientY - dragStartY.current;
        const newOffset = Math.max(0, dragStartOffset.current + delta);
        setDragOffset(newOffset);
        setIsCollapsed(false);
    };

    const handleTouchEnd = () => {
        const threshold = sheetHeight.current * 0.5;
        if (dragOffset > threshold) {
            onClose();
            setDragOffset(0);
            setIsCollapsed(true);
        } else if (dragOffset > 100) {
            setIsCollapsed(true);
            setDragOffset(0);
        } else {
            setIsCollapsed(false);
            setDragOffset(0);
        }
    };

    return (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-1002 pointer-events-none">
            <div
                ref={sheetRef}
                className="bg-card rounded-t-2xl border-t border-border shadow-2xl pointer-events-auto transition-transform duration-300 flex flex-col"
                style={{
                    transform: `translateY(${dragOffset}px)`,
                    maxHeight: "70vh",
                    height: isCollapsed ? "auto" : "70vh",
                }}
                role="complementary"
                aria-label="Extracted Factors"
            >
                <div
                    className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <GripHorizontal className="h-5 w-5 text-muted-foreground" />
                </div>
                {children}
            </div>
        </div>
    );
}

function FactorSkeletons() {
    return (
        <>
            {FACTOR_ORDER.map((key) => (
                <div
                    key={key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                >
                    <span className="text-xs text-muted-foreground">
                        {FACTOR_LABELS[key]}
                    </span>
                    <Skeleton className="h-4 w-20 rounded" />
                </div>
            ))}
        </>
    );
}

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <p className="text-sm text-muted-foreground px-4">{message}</p>
            <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Retry
            </Button>
        </div>
    );
}

function FactorRows({ values }: { values: ExtractedValues }) {
    return (
        <>
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
                        tabIndex={0}
                    >
                        <span className="text-xs text-muted-foreground">
                            {label}
                        </span>
                        <span className="flex items-center gap-1.5">
                            {categorical && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
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
        </>
    );
}

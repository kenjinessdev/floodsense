import type { QueryClient } from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
    HeadContent,
    Outlet,
    createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "../index.css";

export interface RouterAppContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
    component: RootComponent,
    head: () => ({
        meta: [
            {
                title: "floodsense",
            },
            {
                name: "description",
                content: "floodsense is a web application",
            },
        ],
        links: [
            {
                rel: "icon",
                href: "/favicon.ico",
            },
        ],
    }),
});

function RootComponent() {
    return (
        <ThemeProvider defaultTheme="light" attribute="class">
            <HeadContent />

            <div className="grid grid-rows-[auto_1fr] h-svh">
                {/* <Header /> */}
                <Outlet />
            </div>
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools
                position="bottom"
                buttonPosition="bottom-right"
            />
        </ThemeProvider>
    );
}

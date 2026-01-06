import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import ReactDOM from "react-dom/client";

import { env } from "@floodsense/env/web";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { trpc } from "./utils/trpc";

function App() {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `${env.VITE_SERVER_URL}/trpc`,
                }),
            ],
        })
    );

    const router = createRouter({
        routeTree,
        defaultPreload: "intent",
        defaultPendingComponent: () => <Loader />,
        context: { trpc, queryClient },
    });

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </trpc.Provider>
    );
}

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
    throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}

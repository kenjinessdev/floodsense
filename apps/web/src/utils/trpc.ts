import type { AppRouter } from "@floodsense/api/routers/index";

import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url:
                (import.meta.env.VITE_TRPC_URL as string | undefined) ??
                "http://localhost:3000/trpc",
        }),
    ],
});

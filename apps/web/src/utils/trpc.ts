import type { AppRouter } from "@floodsense/api/routers/index";

import { env } from "@floodsense/env/web";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

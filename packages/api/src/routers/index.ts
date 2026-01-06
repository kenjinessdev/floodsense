import { publicProcedure, router } from "../index";
import { floodRouter } from "./flood";

export const appRouter = router({
    healthCheck: publicProcedure.query(() => {
        return "OK";
    }),
    flood: floodRouter,
});
export type AppRouter = typeof appRouter;

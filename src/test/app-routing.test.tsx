import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { clubs } from "@/lib/clubs";
import { routeTree } from "@/routeTree.gen";
import { Route as ClubRoute } from "@/routes/clubs.$clubId";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("serves every club page at /clubs/<slug>", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    for (const club of clubs) {
      const matches = router.matchRoutes(`/clubs/${club.slug}`);
      expect(matches.at(-1)?.routeId).toBe("/clubs/$clubId");
    }
  });

  it("rejects an unknown club and loads a database-added club", async () => {
    const load = ClubRoute.options.loader as (args: { params: { clubId: string }; context: { queryClient: QueryClient } }) => Promise<{ name: string }>;
    const queryClient = new QueryClient();
    const fetch = vi.spyOn(queryClient, "ensureQueryData");
    fetch.mockResolvedValueOnce(null);
    await expect(load({ params: { clubId: "no-such-club" }, context: { queryClient } })).rejects.toMatchObject({ isNotFound: true });
    fetch.mockResolvedValueOnce({ ...clubs[0], slug: "robotics", name: "Robotics" });
    expect((await load({ params: { clubId: "robotics" }, context: { queryClient } })).name).toBe("Robotics");
    fetch.mockRestore();
  });
  it("matches the administrator page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/admin").at(-1)?.routeId).toBe("/admin");
  });
});

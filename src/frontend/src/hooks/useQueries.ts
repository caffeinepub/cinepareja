import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MealMenu, PendingItem, WatchItem } from "../backend.d";
import { useActor } from "./useActor";

// Watch Items
export function useGetAllWatchItems() {
  const { actor, isFetching } = useActor();
  return useQuery<WatchItem[]>({
    queryKey: ["watchItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWatchItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateWatchItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: WatchItem) => {
      if (!actor) throw new Error("No actor");
      return actor.createWatchItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchItems"] });
    },
  });
}

export function useUpdateWatchItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: WatchItem }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateWatchItem(id, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchItems"] });
    },
  });
}

export function useDeleteWatchItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteWatchItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchItems"] });
    },
  });
}

// Pending Items
export function useGetAllPendingItems() {
  const { actor, isFetching } = useActor();
  return useQuery<PendingItem[]>({
    queryKey: ["pendingItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPendingItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePendingItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: PendingItem) => {
      if (!actor) throw new Error("No actor");
      return actor.createPendingItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingItems"] });
    },
  });
}

export function useUpdatePendingItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: PendingItem }) => {
      if (!actor) throw new Error("No actor");
      return actor.updatePendingItem(id, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingItems"] });
    },
  });
}

export function useDeletePendingItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePendingItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingItems"] });
    },
  });
}

// Meal Menus
export function useGetTodaysMenu() {
  const { actor, isFetching } = useActor();
  return useQuery<MealMenu | null>({
    queryKey: ["todaysMenu"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTodaysMenu();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllMealMenus() {
  const { actor, isFetching } = useActor();
  return useQuery<MealMenu[]>({
    queryKey: ["mealMenus"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMealMenus();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertMealMenu() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (menu: MealMenu) => {
      if (!actor) throw new Error("No actor");
      return actor.upsertMealMenu(menu);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todaysMenu"] });
      queryClient.invalidateQueries({ queryKey: ["mealMenus"] });
    },
  });
}

export function useDeleteMealMenu() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteMealMenu(date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todaysMenu"] });
      queryClient.invalidateQueries({ queryKey: ["mealMenus"] });
    },
  });
}

// Last updated for real-time sync
export function useGetLastUpdated() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["lastUpdated"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getLastUpdated();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
    staleTime: 0,
  });
}

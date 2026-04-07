import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AlbumEntry,
  ChatMessage,
  MealMenu,
  PendingItem,
  WatchItem,
} from "../backend.d";
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

// Album Entries
export function useGetAllAlbumEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<AlbumEntry[]>({
    queryKey: ["albumEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAlbumEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAlbumEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      description,
    }: { date: bigint; description: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createAlbumEntry(date, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumEntries"] });
    },
  });
}

export function useAddPhotoToAlbumEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, blobId }: { date: bigint; blobId: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addPhotoToAlbumEntry(date, blobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumEntries"] });
    },
  });
}

export function useRemovePhotoFromAlbumEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, blobId }: { date: bigint; blobId: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.removePhotoFromAlbumEntry(date, blobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumEntries"] });
    },
  });
}

export function useDeleteAlbumEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteAlbumEntry(date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumEntries"] });
    },
  });
}

// Chat Messages
export function useGetAllChatMessages(lastUpdated?: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", lastUpdated?.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChatMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.createChatMessage(content);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}

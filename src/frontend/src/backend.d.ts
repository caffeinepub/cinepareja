import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export type BlobId = string;
export interface AlbumEntry {
    id: Id;
    date: bigint;
    blobIds: Array<BlobId>;
    description: string;
}
export interface WatchItem {
    id: Id;
    status: WatchStatus;
    review: string;
    title: string;
    watchType: WatchType;
    pausedAtMin?: bigint;
    posterUrl?: string;
    notes: string;
    rating: bigint;
    currentEpisode?: string;
}
export type Id = bigint;
export interface ChatMessage {
    id: Id;
    content: string;
    sender: Principal;
    timestamp: bigint;
    senderName: string;
}
export interface MealMenu {
    date: bigint;
    breakfast: string;
    lunch: string;
    notes: string;
    dinner: string;
}
export interface PendingItem {
    id: Id;
    title: string;
    watchType: WatchType;
    posterUrl?: string;
    notes: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WatchStatus {
    pending = "pending",
    completed = "completed",
    watching = "watching"
}
export enum WatchType {
    movie = "movie",
    series = "series"
}
export interface backendInterface {
    addPhotoToAlbumEntry(date: bigint, blobId: BlobId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAlbumEntry(date: bigint, description: string): Promise<Id>;
    createChatMessage(content: string): Promise<{
        __kind__: "ok";
        ok: ChatMessage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPendingItem(input: PendingItem): Promise<Id>;
    createWatchItem(input: WatchItem): Promise<Id>;
    deleteAlbumEntry(date: bigint): Promise<void>;
    deleteMealMenu(date: bigint): Promise<void>;
    deletePendingItem(id: Id): Promise<void>;
    deletePhoto(blobId: BlobId): Promise<void>;
    deleteWatchItem(id: Id): Promise<void>;
    getAlbumEntryByDate(date: bigint): Promise<AlbumEntry | null>;
    getAllAlbumEntries(): Promise<Array<AlbumEntry>>;
    getAllChatMessages(): Promise<Array<ChatMessage>>;
    getAllMealMenus(): Promise<Array<MealMenu>>;
    getAllPendingItems(): Promise<Array<PendingItem>>;
    getAllWatchItems(): Promise<Array<WatchItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLastUpdated(): Promise<Time>;
    getMealMenuByDate(date: bigint): Promise<MealMenu>;
    getPendingItem(id: bigint): Promise<PendingItem>;
    getTodaysMenu(): Promise<MealMenu | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWatchItem(id: Id): Promise<WatchItem>;
    isCallerAdmin(): Promise<boolean>;
    removePhotoFromAlbumEntry(date: bigint, blobId: BlobId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePendingItem(id: Id, item: PendingItem): Promise<void>;
    updateWatchItem(id: Id, item: WatchItem): Promise<void>;
    uploadPhoto(blobId: BlobId): Promise<BlobId>;
    upsertMealMenu(menu: MealMenu): Promise<void>;
}

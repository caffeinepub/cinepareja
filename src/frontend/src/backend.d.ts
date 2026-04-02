import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WatchItem {
    id: Id;
    status: WatchStatus;
    title: string;
    watchType: WatchType;
    pausedAtMin?: bigint;
    notes: string;
}
export type Time = bigint;
export type Id = bigint;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPendingItem(input: PendingItem): Promise<Id>;
    createWatchItem(input: WatchItem): Promise<Id>;
    deleteMealMenu(date: bigint): Promise<void>;
    deletePendingItem(id: Id): Promise<void>;
    deleteWatchItem(id: Id): Promise<void>;
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
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePendingItem(id: Id, item: PendingItem): Promise<void>;
    updateWatchItem(id: Id, item: WatchItem): Promise<void>;
    upsertMealMenu(menu: MealMenu): Promise<void>;
}

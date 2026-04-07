import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Storage "mo:caffeineai-object-storage/Storage";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";

actor {
  type Id = Nat;

  // Persistent Identifiers
  var nextId = 0;

  func generateId() : Id {
    let id = nextId;
    nextId += 1;
    id;
  };

  // Timestamp
  var lastUpdated : Time.Time = Time.now();

  // WatchItem types
  public type WatchType = {
    #movie;
    #series;
  };

  public type WatchStatus = {
    #pending;
    #watching;
    #completed;
  };

  // V1 type (old shape)
  type WatchItemV1 = {
    id : Id;
    title : Text;
    watchType : WatchType;
    status : WatchStatus;
    pausedAtMin : ?Nat;
    notes : Text;
  };

  // V2 type — adds review and currentEpisode
  type WatchItemV2 = {
    id : Id;
    title : Text;
    watchType : WatchType;
    status : WatchStatus;
    pausedAtMin : ?Nat;
    notes : Text;
    currentEpisode : ?Text;
    review : Text;
  };

  // V3 type — adds rating (0-5 stars)
  type WatchItemV3 = {
    id : Id;
    title : Text;
    watchType : WatchType;
    status : WatchStatus;
    pausedAtMin : ?Nat;
    notes : Text;
    currentEpisode : ?Text;
    review : Text;
    rating : Nat;
  };

  // V4 type — adds posterUrl
  public type WatchItem = {
    id : Id;
    title : Text;
    watchType : WatchType;
    status : WatchStatus;
    pausedAtMin : ?Nat;
    notes : Text;
    currentEpisode : ?Text;
    review : Text;
    rating : Nat; // 0 = no rating, 1-5 = stars
    posterUrl : ?Text;
  };

  module WatchItem {
    public func compare(a : WatchItem, b : WatchItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // V1 stable map (migration source)
  let watchItems = Map.empty<Id, WatchItemV1>();

  // V2 stable map (intermediate)
  let watchItemsV2 = Map.empty<Id, WatchItemV2>();

  // V3 stable map (intermediate)
  let watchItemsV3 = Map.empty<Id, WatchItemV3>();

  // V4 stable map (current)
  let watchItemsV4 = Map.empty<Id, WatchItem>();

  var watchItemsMigrated : Bool = false;
  var watchItemsV3Migrated : Bool = false;
  var watchItemsV4Migrated : Bool = false;

  // PendingItem V1 (old shape without posterUrl) — kept for stable compatibility
  type PendingItemV1 = {
    id : Id;
    title : Text;
    watchType : WatchType;
    notes : Text;
  };

  // PendingItem V2 — adds posterUrl
  public type PendingItem = {
    id : Id;
    title : Text;
    watchType : WatchType;
    notes : Text;
    posterUrl : ?Text;
  };

  module PendingItem {
    public func compare(a : PendingItem, b : PendingItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // Old stable map for PendingItem V1 (kept for migration)
  let pendingItems = Map.empty<Id, PendingItemV1>();

  // New stable map for PendingItem V2
  let pendingItemsV2 = Map.empty<Id, PendingItem>();

  var pendingItemsMigrated : Bool = false;

  system func postupgrade() {
    // Migrate WatchItem V1 -> V2
    if (not watchItemsMigrated) {
      for ((k, v) in watchItems.entries()) {
        let migrated : WatchItemV2 = {
          id = v.id;
          title = v.title;
          watchType = v.watchType;
          status = v.status;
          pausedAtMin = v.pausedAtMin;
          notes = v.notes;
          currentEpisode = null;
          review = "";
        };
        watchItemsV2.add(k, migrated);
      };
      watchItems.clear();
      watchItemsMigrated := true;
    };
    // Migrate WatchItem V2 -> V3
    if (not watchItemsV3Migrated) {
      for ((k, v) in watchItemsV2.entries()) {
        let migrated : WatchItemV3 = {
          id = v.id;
          title = v.title;
          watchType = v.watchType;
          status = v.status;
          pausedAtMin = v.pausedAtMin;
          notes = v.notes;
          currentEpisode = v.currentEpisode;
          review = v.review;
          rating = 0;
        };
        watchItemsV3.add(k, migrated);
      };
      watchItemsV2.clear();
      watchItemsV3Migrated := true;
    };
    // Migrate WatchItem V3 -> V4
    if (not watchItemsV4Migrated) {
      for ((k, v) in watchItemsV3.entries()) {
        let migrated : WatchItem = {
          id = v.id;
          title = v.title;
          watchType = v.watchType;
          status = v.status;
          pausedAtMin = v.pausedAtMin;
          notes = v.notes;
          currentEpisode = v.currentEpisode;
          review = v.review;
          rating = v.rating;
          posterUrl = null;
        };
        watchItemsV4.add(k, migrated);
      };
      watchItemsV3.clear();
      watchItemsV4Migrated := true;
    };
    // Migrate PendingItem V1 -> V2
    if (not pendingItemsMigrated) {
      for ((k, v) in pendingItems.entries()) {
        let migrated : PendingItem = {
          id = v.id;
          title = v.title;
          watchType = v.watchType;
          notes = v.notes;
          posterUrl = null;
        };
        pendingItemsV2.add(k, migrated);
      };
      pendingItems.clear();
      pendingItemsMigrated := true;
    };
  };

  // MealMenu module
  public type MealMenu = {
    date : Int; // timestamp, truncated to day
    breakfast : Text;
    lunch : Text;
    dinner : Text;
    notes : Text;
  };

  module MealMenu {
    public func compare(a : MealMenu, b : MealMenu) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  let mealMenus = Map.empty<Int, MealMenu>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage
  include MixinObjectStorage();

  type BlobId = Text;

  // AlbumEntry
  public type AlbumEntry = {
    id : Id;
    date : Int; // timestamp, truncated to day (serves as day key)
    description : Text;
    blobIds : [BlobId];
  };

  module AlbumEntry {
    public func compare(a : AlbumEntry, b : AlbumEntry) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  let albumEntries = Map.empty<Int, AlbumEntry>(); // Map day timestamp to AlbumEntry

  // AlbumEntry creation
  public shared ({ caller }) func createAlbumEntry(date : Int, description : Text) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create album entries");
    };
    let id = generateId();
    let newEntry : AlbumEntry = {
      id;
      date;
      description;
      blobIds = [];
    };

    albumEntries.add(date, newEntry);
    lastUpdated := Time.now();
    id;
  };

  // Add photo to album entry
  public shared ({ caller }) func addPhotoToAlbumEntry(date : Int, blobId : BlobId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add photos to album entries");
    };
    switch (albumEntries.get(date)) {
      case (null) {
        Runtime.trap("Album entry not found for the given date");
      };
      case (?entry) {
        if (entry.blobIds.find(func(id) { id == blobId }) != null) {
          Runtime.trap("Photo already exists in album entry");
        };
        let updatedBlobIds = entry.blobIds.concat([blobId]);
        let updatedEntry = {
          entry with
          blobIds = updatedBlobIds;
        };
        albumEntries.add(date, updatedEntry);
        lastUpdated := Time.now();
      };
    };
  };

  // Remove photo from album entry
  public shared ({ caller }) func removePhotoFromAlbumEntry(date : Int, blobId : BlobId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove photos from album entries");
    };
    switch (albumEntries.get(date)) {
      case (null) {
        Runtime.trap("Album entry not found for the given date");
      };
      case (?entry) {
        let updatedBlobIds = entry.blobIds.filter(func(id) { id != blobId });
        if (updatedBlobIds.size() == entry.blobIds.size()) {
          Runtime.trap("Photo not found in album entry");
        };
        let updatedEntry = {
          entry with
          blobIds = updatedBlobIds;
        };
        albumEntries.add(date, updatedEntry);
        lastUpdated := Time.now();
      };
    };
  };

  // Delete album entry
  public shared ({ caller }) func deleteAlbumEntry(date : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete album entries");
    };
    if (not albumEntries.containsKey(date)) {
      Runtime.trap("Album entry not found for the given date");
    };
    albumEntries.remove(date);
    lastUpdated := Time.now();
  };

  // Get all album entries
  public query ({ caller }) func getAllAlbumEntries() : async [AlbumEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view album entries");
    };
    albumEntries.values().toArray().sort();
  };

  // Get album entry by date
  public query ({ caller }) func getAlbumEntryByDate(date : Int) : async ?AlbumEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view album entries");
    };
    albumEntries.get(date);
  };

  // User Profile
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user: Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // WatchItem functions — all operate on watchItemsV4
  public shared ({ caller }) func createWatchItem(input : WatchItem) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create watch items");
    };
    let id = generateId();
    let newItem : WatchItem = {
      input with
      id;
    };
    watchItemsV4.add(id, newItem);
    lastUpdated := Time.now();
    id;
  };

  public shared ({ caller }) func updateWatchItem(id : Id, item : WatchItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update watch items");
    };
    if (not watchItemsV4.containsKey(id)) {
      Runtime.trap("WatchItem not found");
    };
    watchItemsV4.add(id, item);
    lastUpdated := Time.now();
  };

  public shared ({ caller }) func deleteWatchItem(id : Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete watch items");
    };
    if (not watchItemsV4.containsKey(id)) {
      Runtime.trap("WatchItem not found");
    };
    watchItemsV4.remove(id);
    lastUpdated := Time.now();
  };

  public query ({ caller }) func getWatchItem(id : Id) : async WatchItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watch items");
    };
    switch (watchItemsV4.get(id)) {
      case (null) { Runtime.trap("WatchItem not found") };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getAllWatchItems() : async [WatchItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watch items");
    };
    watchItemsV4.values().toArray().sort();
  };

  // PendingItem functions — all operate on pendingItemsV2
  public shared ({ caller }) func createPendingItem(input : PendingItem) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create pending items");
    };
    let id = generateId();
    let newItem : PendingItem = {
      input with
      id;
    };
    pendingItemsV2.add(id, newItem);
    lastUpdated := Time.now();
    id;
  };

  public shared ({ caller }) func updatePendingItem(id : Id, item : PendingItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update pending items");
    };
    if (not pendingItemsV2.containsKey(id)) {
      Runtime.trap("PendingItem not found");
    };
    pendingItemsV2.add(id, item);
    lastUpdated := Time.now();
  };

  public shared ({ caller }) func deletePendingItem(id : Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete pending items");
    };
    if (not pendingItemsV2.containsKey(id)) {
      Runtime.trap("PendingItem not found");
    };
    pendingItemsV2.remove(id);
    lastUpdated := Time.now();
  };

  public query ({ caller }) func getPendingItem(id : Nat) : async PendingItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pending items");
    };
    switch (pendingItemsV2.get(id)) {
      case (null) { Runtime.trap("PendingItem not found") };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getAllPendingItems() : async [PendingItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pending items");
    };
    pendingItemsV2.values().toArray().sort();
  };

  // MealMenu functions
  public shared ({ caller }) func upsertMealMenu(menu : MealMenu) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update meal menus");
    };
    mealMenus.add(menu.date, menu);
    lastUpdated := Time.now();
  };

  public shared ({ caller }) func deleteMealMenu(date : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete meal menus");
    };
    if (not mealMenus.containsKey(date)) {
      Runtime.trap("MealMenu not found");
    };
    mealMenus.remove(date);
    lastUpdated := Time.now();
  };

  public query ({ caller }) func getMealMenuByDate(date : Int) : async MealMenu {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view meal menus");
    };
    switch (mealMenus.get(date)) {
      case (null) { Runtime.trap("MealMenu not found") };
      case (?menu) { menu };
    };
  };

  public query ({ caller }) func getAllMealMenus() : async [MealMenu] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view meal menus");
    };
    mealMenus.values().toArray().sort();
  };

  public query ({ caller }) func getTodaysMenu() : async ?MealMenu {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view meal menus");
    };
    let today = Time.now();
    mealMenus.get(today);
  };

  // ChatMessage
  public type ChatMessage = {
    id : Id;
    sender : Principal;
    senderName : Text;
    content : Text;
    timestamp : Int;
  };

  module ChatMessage {
    public func compare(a : ChatMessage, b : ChatMessage) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  let chatMessages = Map.empty<Id, ChatMessage>();

  public shared ({ caller }) func createChatMessage(content : Text) : async { #ok : ChatMessage; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can send chat messages");
    };
    let senderName = switch (userProfiles.get(caller)) {
      case (?profile) { profile.name };
      case null { caller.toText() };
    };
    let id = generateId();
    let msg : ChatMessage = {
      id;
      sender = caller;
      senderName;
      content;
      timestamp = Time.now();
    };
    chatMessages.add(id, msg);
    lastUpdated := Time.now();
    #ok(msg);
  };

  public query ({ caller }) func getAllChatMessages() : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat messages");
    };
    chatMessages.values().toArray().sort();
  };

  // Get last updated timestamp
  public query ({ caller }) func getLastUpdated() : async Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sync information");
    };
    lastUpdated;
  };

  // Photo Album (interacting with blob storage)
  public shared ({ caller }) func uploadPhoto(blobId : BlobId) : async BlobId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload photos");
    };
    lastUpdated := Time.now();
    blobId;
  };

  public shared ({ caller }) func deletePhoto(blobId : BlobId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete photos");
    };
    lastUpdated := Time.now();
  };
};

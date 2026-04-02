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
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

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

  // WatchItem module
  public type WatchType = {
    #movie;
    #series;
  };

  public type WatchStatus = {
    #pending;
    #watching;
    #completed;
  };

  public type WatchItem = {
    id : Id;
    title : Text;
    watchType : WatchType;
    status : WatchStatus;
    pausedAtMin : ?Nat;
    notes : Text;
  };

  module WatchItem {
    public func compare(a : WatchItem, b : WatchItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  let watchItems = Map.empty<Id, WatchItem>();

  // PendingItem module
  public type PendingItem = {
    id : Id;
    title : Text;
    watchType : WatchType;
    notes : Text;
  };

  module PendingItem {
    public func compare(a : PendingItem, b : PendingItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  let pendingItems = Map.empty<Id, PendingItem>();

  // MealMenu module
  public type MealMenu = {
    date : Int;
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

  // WatchItem functions
  public shared ({ caller }) func createWatchItem(input : WatchItem) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create watch items");
    };
    let id = generateId();
    let newItem : WatchItem = {
      input with
      id;
    };
    watchItems.add(id, newItem);
    lastUpdated := Time.now();
    id;
  };

  public shared ({ caller }) func updateWatchItem(id : Id, item : WatchItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update watch items");
    };
    if (not watchItems.containsKey(id)) {
      Runtime.trap("WatchItem not found");
    };
    watchItems.add(id, item);
    lastUpdated := Time.now();
  };

  public shared ({ caller }) func deleteWatchItem(id : Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete watch items");
    };
    if (not watchItems.containsKey(id)) {
      Runtime.trap("WatchItem not found");
    };
    watchItems.remove(id);
    lastUpdated := Time.now();
  };

  public query ({ caller }) func getWatchItem(id : Id) : async WatchItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watch items");
    };
    switch (watchItems.get(id)) {
      case (null) { Runtime.trap("WatchItem not found") };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getAllWatchItems() : async [WatchItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watch items");
    };
    watchItems.values().toArray().sort();
  };

  // PendingItem functions
  public shared ({ caller }) func createPendingItem(input : PendingItem) : async Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create pending items");
    };
    let id = generateId();
    let newItem : PendingItem = {
      input with
      id;
    };
    pendingItems.add(id, newItem);
    lastUpdated := Time.now();
    id;
  };

  public shared ({ caller }) func updatePendingItem(id : Id, item : PendingItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update pending items");
    };
    if (not pendingItems.containsKey(id)) {
      Runtime.trap("PendingItem not found");
    };
    pendingItems.add(id, item);
    lastUpdated := Time.now();
  };

  public shared ({ caller }) func deletePendingItem(id : Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete pending items");
    };
    if (not pendingItems.containsKey(id)) {
      Runtime.trap("PendingItem not found");
    };
    pendingItems.remove(id);
    lastUpdated := Time.now();
  };

  public query ({ caller }) func getPendingItem(id : Nat) : async PendingItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pending items");
    };
    switch (pendingItems.get(id)) {
      case (null) { Runtime.trap("PendingItem not found") };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getAllPendingItems() : async [PendingItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pending items");
    };
    pendingItems.values().toArray().sort();
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

  // Get last updated timestamp
  public query ({ caller }) func getLastUpdated() : async Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sync information");
    };
    lastUpdated;
  };
};

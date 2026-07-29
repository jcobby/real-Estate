/**
 * Mock service layer.
 *
 * Every UI data access goes through these async functions — never through the
 * raw mock arrays. To connect a real backend, reimplement these modules with
 * fetch/axios calls that return the same types from src/types.
 */
export * from "./auth";
export * from "./listings";
export * from "./parcels";
export * from "./messages";
export * from "./notifications";
export * from "./purchases";
export * from "./verification";
export * from "./providers";
export * from "./reviews";
export * from "./admin";
export * from "./leads";
export * from "./users";
export * from "./materials";
export * from "./conflicts";
export { resetDb } from "@/lib/mock/db";

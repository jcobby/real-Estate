"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ListingFilters, SavedSearch } from "@/types";

interface FavoritesState {
  favorites: string[];
  savedSearches: SavedSearch[];
  recentlyViewed: string[];
  monitoredParcels: string[];
  toggleFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
  saveSearch: (name: string, filters: ListingFilters) => void;
  removeSavedSearch: (id: string) => void;
  toggleSearchAlerts: (id: string) => void;
  pushRecentlyViewed: (listingId: string) => void;
  toggleMonitorParcel: (parcelId: string) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      savedSearches: [],
      recentlyViewed: [],
      monitoredParcels: [],
      toggleFavorite: (listingId) =>
        set((s) => ({
          favorites: s.favorites.includes(listingId)
            ? s.favorites.filter((id) => id !== listingId)
            : [listingId, ...s.favorites],
        })),
      isFavorite: (listingId) => get().favorites.includes(listingId),
      saveSearch: (name, filters) =>
        set((s) => ({
          savedSearches: [
            {
              id: `ss-${Date.now().toString(36)}`,
              name,
              filters,
              alerts: true,
              createdAt: new Date().toISOString(),
            },
            ...s.savedSearches,
          ],
        })),
      removeSavedSearch: (id) =>
        set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
      toggleSearchAlerts: (id) =>
        set((s) => ({
          savedSearches: s.savedSearches.map((x) => (x.id === id ? { ...x, alerts: !x.alerts } : x)),
        })),
      pushRecentlyViewed: (listingId) =>
        set((s) => ({
          recentlyViewed: [listingId, ...s.recentlyViewed.filter((id) => id !== listingId)].slice(0, 8),
        })),
      toggleMonitorParcel: (parcelId) =>
        set((s) => ({
          monitoredParcels: s.monitoredParcels.includes(parcelId)
            ? s.monitoredParcels.filter((id) => id !== parcelId)
            : [parcelId, ...s.monitoredParcels],
        })),
    }),
    { name: "realestate:favorites" },
  ),
);

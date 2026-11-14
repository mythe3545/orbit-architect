import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useSettings } from "@/lib/settings";
import type { Astronaut, Blueprint, Catalog, NasaImage, RocketAnalysis, StackItem } from "@/lib/types";

const KEY = "astro_id";
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function setAstronautId(id: string | null) {
  if (id) localStorage.setItem(KEY, id); else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useAstronautId() {
  return useSyncExternalStore(subscribe, () => localStorage.getItem(KEY));
}

export function useAstronaut() {
  const id = useAstronautId();
  return useQuery({
    queryKey: ["astronaut", id],
    queryFn: () => apiGet<Astronaut>(`/astronauts/${id}`),
    enabled: !!id,
  });
}

export function useCatalog() {
  const { lang } = useSettings();
  return useQuery({ queryKey: ["catalog", lang], queryFn: () => apiGet<Catalog>(`/catalog?lang=${lang}`), staleTime: Infinity, placeholderData: keepPreviousData });
}

export function useAnalysis(stack: StackItem[], astronautId: string | null) {
  const { lang } = useSettings();
  return useQuery({
    queryKey: ["analyze", stack, astronautId, lang],
    queryFn: () => apiPost<RocketAnalysis>("/rocket/analyze", { stack, astronaut_id: astronautId, lang }),
    placeholderData: keepPreviousData,
  });
}

export function useNasaImages(q: string, limit = 1) {
  return useQuery({
    queryKey: ["nasa-img", q, limit],
    queryFn: () => apiGet<NasaImage[]>(`/nasa/images?q=${encodeURIComponent(q)}&limit=${limit}`),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useSaveBlueprint() {
  const qc = useQueryClient();
  const id = useAstronautId();
  const m = useMutation({
    mutationFn: (bp: Blueprint) => apiPut<Astronaut>(`/astronauts/${id}/blueprint`, bp),
    onSuccess: (a) => qc.setQueryData(["astronaut", a.id], a),
  });
  return { ...m, save: useCallback((bp: Blueprint) => m.mutateAsync(bp), [m]) };
}

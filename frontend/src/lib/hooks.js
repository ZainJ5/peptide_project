"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, toQueryString } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function useAuthedRequest() {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (path, options = {}) =>
    apiRequest(path, {
      ...options,
      token,
      refreshToken,
      onRefresh: (payload) => {
        setAuth({ token: payload.token, refreshToken: payload.refreshToken, user: payload.user });
      },
    }).catch((error) => {
      if (error.status === 401) clearAuth();
      throw error;
    });
}

export function usePeptides(filters) {
  const request = useAuthedRequest();
  const query = useMemo(() => toQueryString(filters), [filters]);
  return useQuery({
    queryKey: ["peptides", query],
    queryFn: () => request(`/peptides${query}`),
  });
}

export function usePeptideCategories() {
  const request = useAuthedRequest();
  return useQuery({
    queryKey: ["peptide-categories"],
    queryFn: () => request("/peptides/categories"),
  });
}

export function usePeptideDetail(id) {
  const request = useAuthedRequest();
  return useQuery({
    queryKey: ["peptide", id],
    queryFn: () => request(`/peptides/${id}`),
    enabled: Boolean(id),
  });
}

export function useVideos(filters) {
  const request = useAuthedRequest();
  const query = useMemo(() => toQueryString(filters), [filters]);
  return useQuery({
    queryKey: ["videos", query],
    queryFn: () => request(`/videos${query}`),
  });
}

export function useCommunityPosts(filters) {
  const request = useAuthedRequest();
  const query = useMemo(() => toQueryString(filters), [filters]);
  return useQuery({
    queryKey: ["community", query],
    queryFn: () => request(`/community${query}`),
  });
}

export function useSchedules() {
  const request = useAuthedRequest();
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["schedules"],
    queryFn: () => request("/schedules"),
    enabled: Boolean(token),
  });
}

export function useProfile() {
  const request = useAuthedRequest();
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ["me"],
    queryFn: () => request("/users/me"),
    enabled: Boolean(token),
  });
}

export function useAuthMutations() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const login = useMutation({
    mutationFn: (payload) => apiRequest("/auth/login", { method: "POST", body: payload }),
    onSuccess: (response) => setAuth({ token: response.token, refreshToken: response.refreshToken, user: response.user }),
  });

  const register = useMutation({
    mutationFn: (payload) => apiRequest("/auth/register", { method: "POST", body: payload }),
    onSuccess: (response) => setAuth({ token: response.token, refreshToken: response.refreshToken, user: response.user }),
  });

  return {
    login,
    register,
    logout: clearAuth,
  };
}

export function useCreateCommunityPost() {
  const request = useAuthedRequest();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => request("/community", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community"] }),
  });
}

export function useUpvoteCommunityPost() {
  const request = useAuthedRequest();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => request(`/community/${postId}/upvote`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community"] }),
  });
}

export function useDeleteCommunityPost() {
  const request = useAuthedRequest();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => request(`/community/${postId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community"] }),
  });
}

export function useScheduleBuilderMutations() {
  const request = useAuthedRequest();

  const createSchedule = useMutation({
    mutationFn: (body) => request("/schedules", { method: "POST", body }),
  });

  const addItem = useMutation({
    mutationFn: ({ scheduleId, body }) => request(`/schedules/${scheduleId}/items`, { method: "POST", body }),
  });

  const preview = useMutation({
    mutationFn: (scheduleId) => request(`/schedules/${scheduleId}/preview`),
  });

  const generate = useMutation({
    mutationFn: (scheduleId) => request(`/schedules/${scheduleId}/generate`, { method: "POST" }),
  });

  const calendar = useMutation({
    mutationFn: (scheduleId) => request(`/schedules/${scheduleId}/calendar`),
  });

  const completeEvent = useMutation({
    mutationFn: ({ scheduleId, eventId, completed }) =>
      request(`/schedules/${scheduleId}/calendar/${eventId}/complete`, {
        method: "PATCH",
        body: { completed },
      }),
  });

  return { createSchedule, addItem, preview, generate, calendar, completeEvent };
}

export function useScheduleCalendar(scheduleId, month) {
  const request = useAuthedRequest();
  const token = useAuthStore((s) => s.token);
  const qs = month ? `?month=${month}` : '';
  return useQuery({
    queryKey: month ? ["schedule-calendar", scheduleId, month] : ["schedule-calendar", scheduleId],
    queryFn: () => request(`/schedules/${scheduleId}/calendar${qs}`),
    enabled: Boolean(token) && Boolean(scheduleId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCompleteEvent() {
  const request = useAuthedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, eventId, completed }) =>
      request(`/schedules/${scheduleId}/calendar/${eventId}/complete`, {
        method: "PATCH",
        body: { completed },
      }),
    onMutate: async (variables) => {
      const { scheduleId, eventId, completed } = variables;
      const allKeys = queryClient.getQueriesData({ queryKey: ["schedule-calendar", scheduleId] });
      const snapshots = [];
      for (const [key, data] of allKeys) {
        if (!data?.data) continue;
        snapshots.push({ key, data: structuredClone(data) });
        const updated = { ...data, data: { ...data.data } };
        for (const [month, dates] of Object.entries(updated.data)) {
          const newDates = { ...dates };
          for (const [date, events] of Object.entries(newDates)) {
            const idx = events.findIndex((e) => e.id === eventId);
            if (idx !== -1) {
              const newEvents = [...events];
              newEvents[idx] = { ...newEvents[idx], isCompleted: completed, completedAt: completed ? new Date().toISOString() : null };
              newDates[date] = newEvents;
            }
          }
          updated.data[month] = newDates;
        }
        queryClient.setQueryData(key, updated);
      }
      return { snapshots };
    },
    onError: (_, __, context) => {
      if (context?.snapshots) {
        for (const { key, data } of context.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schedule-calendar", variables.scheduleId] });
    },
  });
}

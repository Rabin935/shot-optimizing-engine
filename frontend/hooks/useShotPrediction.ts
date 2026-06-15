"use client";

import { useEffect, useMemo, useState } from "react";
import {
  predictShot,
  type ShotPredictionRequest,
  type ShotPredictionResponse,
} from "@/lib/api/shotPrediction";

export type ShotPredictionConnectionStatus =
  | "idle"
  | "loading"
  | "connected"
  | "offline";

type UseShotPredictionOptions = {
  debounceMs?: number;
};

export function useShotPrediction(
  request: ShotPredictionRequest | null,
  options: UseShotPredictionOptions = {},
) {
  const debounceMs = options.debounceMs ?? 400;
  const requestKey = useMemo(() => {
    // Serialize the request so effect dependencies stay stable between renders.
    if (!request) {
      return "";
    }

    return JSON.stringify(request);
  }, [request]);
  const [prediction, setPrediction] = useState<ShotPredictionResponse | null>(
    null,
  );
  const [status, setStatus] =
    useState<ShotPredictionConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!requestKey) {
      // No request means there is no backend prediction to fetch yet.
      return;
    }

    // AbortController prevents older requests from updating state after changes.
    const controller = new AbortController();
    const nextRequest = JSON.parse(requestKey) as ShotPredictionRequest;

    const timeoutId = window.setTimeout(async () => {
      // Debounce keeps dragging from firing a backend request on every pixel move.
      setStatus("loading");
      setErrorMessage(null);

      try {
        const result = await predictShot(nextRequest, {
          signal: controller.signal,
        });

        setPrediction(result);
        setStatus("connected");
      } catch (error) {
        if (controller.signal.aborted) {
          // Ignore expected aborts from rapid input changes.
          return;
        }

        // If the backend is offline, let the UI fall back to local sandbox stats.
        setPrediction(null);
        setStatus("offline");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Backend offline - using local estimate",
        );
      }
    }, debounceMs);

    return () => {
      // Cleanup cancels the timer and any in-flight request for stale inputs.
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [debounceMs, requestKey]);

  return {
    errorMessage,
    isBackendOffline: status === "offline",
    isLoading: status === "loading",
    prediction,
    status,
  };
}

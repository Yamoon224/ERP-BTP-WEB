import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary, Single } from "@/types/api";

export async function summary(): Promise<DashboardSummary> {
  const response = await apiFetch<Single<DashboardSummary>>("/dashboard/matching");

  return response.data;
}

import { apiFetch } from "@/lib/api-client";
import type { Paginated, Project, Supplier } from "@/types/api";

export interface ListParams {
  search?: string;
  page?: number;
  per_page?: number;
  is_active?: boolean;
}

export function listSuppliers(params: ListParams = {}): Promise<Paginated<Supplier>> {
  return apiFetch<Paginated<Supplier>>("/suppliers", { query: { ...params } });
}

export function listProjects(params: ListParams = {}): Promise<Paginated<Project>> {
  return apiFetch<Paginated<Project>>("/projects", { query: { ...params } });
}

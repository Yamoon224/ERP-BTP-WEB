import { apiFetch } from "@/lib/api-client";
import type { Paginated, Project, Single, Supplier } from "@/types/api";

export interface ListParams {
  search?: string;
  page?: number;
  per_page?: number;
  is_active?: boolean;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface SupplierInput {
  code: string;
  name: string;
  vat_number?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export interface ProjectInput {
  code: string;
  name: string;
  client_name?: string | null;
  is_active?: boolean;
}

// --- Fournisseurs -----------------------------------------------------------

export function listSuppliers(params: ListParams = {}): Promise<Paginated<Supplier>> {
  return apiFetch<Paginated<Supplier>>("/suppliers", { query: { ...params } });
}

export async function findSupplier(id: number): Promise<Supplier> {
  const response = await apiFetch<Single<Supplier>>(`/suppliers/${id}`);

  return response.data;
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const response = await apiFetch<Single<Supplier>>("/suppliers", {
    method: "POST",
    body: input,
  });

  return response.data;
}

export async function updateSupplier(
  id: number,
  input: Partial<SupplierInput>,
): Promise<Supplier> {
  const response = await apiFetch<Single<Supplier>>(`/suppliers/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data;
}

/**
 * Refuse (409 `supplier_in_use`) des qu'une commande ou une facture cite la
 * fiche. Le geste equivalent, dans ce cas, est la desactivation : elle retire
 * le fournisseur des listes de saisie sans amputer la piste d'audit.
 */
export function removeSupplier(id: number): Promise<void> {
  return apiFetch<void>(`/suppliers/${id}`, { method: "DELETE" });
}

// --- Chantiers --------------------------------------------------------------

export function listProjects(params: ListParams = {}): Promise<Paginated<Project>> {
  return apiFetch<Paginated<Project>>("/projects", { query: { ...params } });
}

export async function findProject(id: number): Promise<Project> {
  const response = await apiFetch<Single<Project>>(`/projects/${id}`);

  return response.data;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const response = await apiFetch<Single<Project>>("/projects", {
    method: "POST",
    body: input,
  });

  return response.data;
}

export async function updateProject(id: number, input: Partial<ProjectInput>): Promise<Project> {
  const response = await apiFetch<Single<Project>>(`/projects/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data;
}

/** Refuse (409 `project_in_use`) des qu'un bon de commande porte le chantier. */
export function removeProject(id: number): Promise<void> {
  return apiFetch<void>(`/projects/${id}`, { method: "DELETE" });
}

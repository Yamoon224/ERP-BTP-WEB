import { apiFetch } from "@/lib/api-client";
import type { AdminUser, Paginated, Role, Single, User } from "@/types/api";

export interface UserListParams {
  search?: string;
  role?: string;
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface UserInput {
  name: string;
  email: string;
  /** Absent ou null a la modification : le mot de passe existant est conserve. */
  password?: string | null;
  roles: string[];
}

export interface ProfileInput {
  name: string;
  email: string;
}

export interface PasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function list(params: UserListParams = {}): Promise<Paginated<AdminUser>> {
  return apiFetch<Paginated<AdminUser>>("/users", { query: { ...params } });
}

export async function find(id: string): Promise<AdminUser> {
  const response = await apiFetch<Single<AdminUser>>(`/users/${id}`);

  return response.data;
}

export async function create(input: UserInput): Promise<AdminUser> {
  const response = await apiFetch<Single<AdminUser>>("/users", { method: "POST", body: input });

  return response.data;
}

export async function update(id: string, input: Partial<UserInput>): Promise<AdminUser> {
  const response = await apiFetch<Single<AdminUser>>(`/users/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data;
}

/**
 * Le backend refuse en 409 la suppression de son propre compte et celle du
 * dernier administrateur : l'interface relaie le message plutot que de
 * dupliquer la regle.
 */
export function remove(id: string): Promise<void> {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

export async function listRoles(): Promise<Role[]> {
  const response = await apiFetch<{ data: Role[] }>("/roles");

  return response.data;
}

// --- Compte de l'utilisateur connecte --------------------------------------

/** Ne modifie que l'appelant : ni role ni mot de passe ne passent par la. */
export async function updateProfile(input: ProfileInput): Promise<User> {
  const response = await apiFetch<Single<User>>("/me", { method: "PATCH", body: input });

  return response.data;
}

/**
 * Changement de mot de passe. L'ancien est exige : sans lui, un jeton vole
 * suffirait a verrouiller le compte de sa victime.
 */
export async function updatePassword(input: PasswordInput): Promise<string> {
  const response = await apiFetch<{ data: { message: string } }>("/me/password", {
    method: "PUT",
    body: input,
  });

  return response.data.message;
}

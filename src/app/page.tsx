import { redirect } from "next/navigation";

/** La racine n'a pas de contenu propre : tout part du tableau de bord. */
export default function RootPage() {
  redirect("/dashboard");
}

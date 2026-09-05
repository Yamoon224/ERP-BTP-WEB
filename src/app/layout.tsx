import type { Metadata } from "next";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP BTP - Rapprochement à 3 voies",
  description:
    "Contrôle des règlements fournisseurs par rapprochement du bon de commande, du bon de livraison et de la facture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` : le script de theme modifie la classe de
    // <html> avant l'hydratation, ce qui est precisement son role.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

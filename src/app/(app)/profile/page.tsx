import { PageHeader } from "@/components/ui";
import { IconUser } from "@/components/ui/icons";
import { ProfileView } from "@/features/profile/ProfileView";

export const metadata = { title: "Mon profil — ERP BTP" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Mon profil"
        description="Votre identité dans l'application, vos droits effectifs et vos préférences d'affichage."
        icon={<IconUser className="h-5 w-5" />}
      />
      <ProfileView />
    </>
  );
}

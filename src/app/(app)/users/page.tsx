import { PageHeader } from "@/components/ui";
import { IconUsers } from "@/components/ui/icons";
import { UserList } from "@/features/users/UserList";

export const metadata = { title: "Utilisateurs - ERP BTP" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Qui accède à quoi. La séparation des tâches — commander, réceptionner, facturer, arbitrer — se règle ici, par les rôles."
        icon={<IconUsers className="h-5 w-5" />}
      />
      <UserList />
    </>
  );
}

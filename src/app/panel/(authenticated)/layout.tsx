import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PanelShellClient from "@/components/PanelShellClient";

export default async function ProtectedPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/panel");
  return <PanelShellClient>{children}</PanelShellClient>;
}

import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1980px] gap-6 px-5 py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-7 lg:py-6">
      <SidebarNav />
      <div className="space-y-6">{children}</div>
    </div>
  );
}

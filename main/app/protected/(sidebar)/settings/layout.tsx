

import { PropsWithChildren } from "react";
import SettingsNavigation from "./_components/settings-navigation";


export default function SettingsLayout({ children }: PropsWithChildren) {


  return (
    <div className="flex flex-col gap-4">
      <SettingsNavigation />
      <div className="flex-1">{children}</div>
    </div>
  );
}


import { PropsWithChildren } from "react";
import SettingsNavigation from "./_components/settings-navigation";


export default function SettingsLayout({ children }: PropsWithChildren) {


  return (
    <div className="">
      <SettingsNavigation />

      <div>{children}</div>
    </div>
  );
}
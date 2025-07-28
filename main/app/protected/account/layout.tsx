

import { PropsWithChildren } from "react";
import AccountNavigation from "./_components/account-navigation";



export default function AccountLayout({ children }: PropsWithChildren) {


  return (
    <div className="">
        <AccountNavigation />

      <div>{children}</div>
    </div>
  );
}
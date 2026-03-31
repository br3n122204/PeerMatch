import type { ReactNode } from "react";

export default function Template({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <div className="ui-route-enter">{children}</div>;
}


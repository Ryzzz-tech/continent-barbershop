import type { ReactNode } from "react";

export function OwnerPageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="cashier-page-heading owner-page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function OwnerPrototypeNote({ children }: { children: ReactNode }) {
  return <p className="cashier-prototype-note owner-prototype-note">{children}</p>;
}

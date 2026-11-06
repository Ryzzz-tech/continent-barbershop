import type { ReactNode } from "react";

export function CashierPageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="cashier-page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function CashierPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cashier-panel${className ? ` ${className}` : ""}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function CashierPrototypeNote({ children }: { children: ReactNode }) {
  return <p className="cashier-prototype-note">{children}</p>;
}

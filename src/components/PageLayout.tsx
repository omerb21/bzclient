import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-title">אזור הלקוח - נתוני קופות</div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <span>Unified CRM</span>
      </footer>
    </div>
  );
}

export default PageLayout;

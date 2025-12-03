import AccountsPage from "./pages/AccountsPage";
import ClientAccessAdminPage from "./pages/ClientAccessAdminPage";
import PageLayout from "./components/PageLayout";

function App() {
  let isAdmin = false;

  if (typeof window !== "undefined") {
    try {
      const url = new URL(window.location.href);
      const adminParam = url.searchParams.get("admin");
      isAdmin = adminParam === "client-access";
    } catch {
      isAdmin = false;
    }
  }

  return (
    <PageLayout>
      {isAdmin ? <ClientAccessAdminPage /> : <AccountsPage />}
    </PageLayout>
  );
}

export default App;

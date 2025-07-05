





import Layout from "@/components/layout/layout";
import BalanceSheetPage from "@/pages/BalanceSheetPage";
import LoginPage from "@/pages/LoginPage";
import TransactionsPage from "@/pages/TransactionsPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import RequireAuth from "@/components/RequireAuth";


function App() {
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem("firebase_jwt", token);
      } else {
        localStorage.removeItem("firebase_jwt");
      }
    });

    // Optionally, force refresh every 50 minutes (token expires in 1 hour)
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true); // force refresh
        localStorage.setItem("firebase_jwt", token);
      }
    }, 50 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/balance-sheet" element={<BalanceSheetPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App

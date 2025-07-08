





import Layout from "@/components/layout/layout";
import BalanceSheetPage from "@/pages/BalanceSheetPage";
import LoginPage from "@/pages/LoginPage";

import TransactionsPage from "@/pages/TransactionsPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import RequireAuth from "@/components/RequireAuth";
import FileStatementsPage from "./pages/FileStatementsPage";


function App() {
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      console.log("[onIdTokenChanged] user:", user);
      if (user) {
        // Check expiry before refreshing token
        const expiresAtStr = localStorage.getItem("firebase_jwt_expires_at");
        const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
        if (expiresAt && Date.now() > expiresAt) {
          // Expired: logout
          console.log("[onIdTokenChanged] token expired, logging out");
          localStorage.removeItem("firebase_jwt");
          localStorage.removeItem("firebase_jwt_expires_at");
          await auth.signOut();
          return;
        }
        // Not expired: refresh token and set new expiry
        const token = await user.getIdToken();
        const newExpiresAt = Date.now() + 4 * 60 * 60 * 1000;
        console.log("[onIdTokenChanged] new token set (force refresh)", token, "expires at", new Date(newExpiresAt));
        localStorage.setItem("firebase_jwt", token);
        localStorage.setItem("firebase_jwt_expires_at", newExpiresAt.toString());
      } else {
        console.log("[onIdTokenChanged] user signed out, removing token");
        localStorage.removeItem("firebase_jwt");
        localStorage.removeItem("firebase_jwt_expires_at");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper component for /login route to redirect if already authenticated
  function LoginOrRedirect() {
    const isAuthenticated = !!localStorage.getItem("firebase_jwt");
    if (isAuthenticated) {
      return <Navigate to="/balance-sheet" replace />;
    }
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginOrRedirect />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/balance-sheet" element={<BalanceSheetPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/file-statements" element={<FileStatementsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App

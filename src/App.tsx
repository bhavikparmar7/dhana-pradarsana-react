



import Layout from "@/components/layout/layout";
import BalanceSheetPage from "@/pages/BalanceSheetPage";
import LoginPage from "@/pages/LoginPage";
import TransactionsPage from "@/pages/TransactionsPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/balance-sheet" element={<BalanceSheetPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

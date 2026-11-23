import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { GuestRoute } from "./components/ProtectedRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { VaultProvider } from "./context/VaultContext.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import RegisterTenant from "./pages/RegisterTenant.jsx";

export default function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterTenant /></GuestRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="*" element={<ComingSoon />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </VaultProvider>
    </AuthProvider>
  );
}

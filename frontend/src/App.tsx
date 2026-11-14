import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Builder from "@/pages/Builder";
import Launch from "@/pages/Launch";
import Hangar from "@/pages/Hangar";
import Dossier from "@/pages/Dossier";
import SettingsPage from "@/pages/Settings";
import AppShell from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AppShell />}>
          <Route path="/builder" element={<Builder />} />
          <Route path="/launch" element={<Launch />} />
          <Route path="/hangar" element={<Hangar />} />
          <Route path="/dossier" element={<Dossier />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors theme="dark" />
    </>
  );
}

import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSettings } from "@/lib/settings";
import Tutorial from "@/pages/Tutorial";
import Login from "@/pages/Login";
import Builder from "@/pages/Builder";
import Launch from "@/pages/Launch";
import Hangar from "@/pages/Hangar";
import Dossier from "@/pages/Dossier";
import SettingsPage from "@/pages/Settings";
import Achievements from "@/pages/Achievements";
import AppShell from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

/** Applies the chosen menu colour theme (index.css html[data-ui]) app-wide. */
function UiThemeSync() {
  const { ui } = useSettings();
  useEffect(() => { document.documentElement.dataset.ui = ui; }, [ui]);
  return null;
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <UiThemeSync />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AppShell />}>
          <Route path="/builder" element={<Builder />} />
          <Route path="/launch" element={<Launch />} />
          <Route path="/hangar" element={<Hangar />} />
          <Route path="/dossier" element={<Dossier />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/tutorial" element={<Tutorial />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors theme="dark" />
    </>
  );
}

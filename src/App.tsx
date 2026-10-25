import { useEffect } from "react";
import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Bestiary from "./screens/Bestiary";
import BestiaryEntry from "./screens/BestiaryEntry";
import Capture from "./screens/Capture";
import Encounter from "./screens/Encounter";
import Home from "./screens/Home";
import Learn from "./screens/Learn";
import Settings from "./screens/Settings";
import Support from "./screens/Support";
import Tame from "./screens/Tame";
import { useAppStore } from "./store";

// Hash routing so deep links survive a refresh on GitHub Pages.
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/new", element: <Capture /> },
      { path: "/encounter/:id", element: <Encounter /> },
      { path: "/encounter/:id/tame", element: <Tame /> },
      { path: "/bestiary", element: <Bestiary /> },
      { path: "/bestiary/:id", element: <BestiaryEntry /> },
      { path: "/learn", element: <Learn /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
  // Support sits outside the game layout: no game elements or terminology (S3).
  { path: "/support", element: <Support /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  const reducedMotion = useAppStore((state) => state.settings.reducedMotion);

  // theme.css reads this to switch motion off or back on, overriding the OS preference.
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);

  return <RouterProvider router={router} />;
}

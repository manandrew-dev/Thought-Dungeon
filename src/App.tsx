import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Bestiary from "./screens/Bestiary";
import Capture from "./screens/Capture";
import Encounter from "./screens/Encounter";
import Home from "./screens/Home";
import Learn from "./screens/Learn";
import Settings from "./screens/Settings";
import Support from "./screens/Support";
import Tame from "./screens/Tame";

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
      { path: "/learn", element: <Learn /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
  // Support sits outside the game layout: no game elements or terminology (S3).
  { path: "/support", element: <Support /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

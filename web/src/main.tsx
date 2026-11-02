import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Play } from "@/components/Play";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Play />
  </StrictMode>,
);

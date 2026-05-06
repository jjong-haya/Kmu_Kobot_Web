
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { installChunkLoadRecovery } from "./app/utils/chunkLoadRecovery.ts";
  import "./styles/index.css";

  installChunkLoadRecovery();
  createRoot(document.getElementById("root")!).render(<App />);
  

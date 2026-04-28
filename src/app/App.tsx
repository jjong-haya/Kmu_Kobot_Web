import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./auth/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

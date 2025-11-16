import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import AddItem from "./pages/AddItem";
import ItemDetail from "./pages/ItemDetail";
import MyLeases from "./pages/MyLeases";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import RScore from "./pages/RScore";
import Wallet from "./pages/Wallet";
import MyDetails from "./pages/MyDetails";
import NotFound from "./pages/NotFound";
import { ToastProvider } from "./components/ui/toast";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    { path: "/", element: <Home /> },
    { path: "/browse", element: <Browse /> },
    { path: "/add-item", element: <AddItem /> },
    { path: "/item/:id", element: <ItemDetail /> },
    { path: "/my-leases", element: <MyLeases /> },
    { path: "/my-details", element: <MyDetails /> },
    { path: "/wallet", element: <Wallet /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/profile", element: <Profile /> },
    { path: "/rscore", element: <RScore /> },
    { path: "*", element: <NotFound /> },
  ]
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </ToastProvider>
  </QueryClientProvider>
);

export default App;

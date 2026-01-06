import { RouterProvider } from "react-router-dom";
import router from "./router/router";
import { AuthProvider } from "./context/AuthProvider";
import { Toaster } from "sonner";

export default function App() {
    return (
        <div className="App">
            <AuthProvider>
                <RouterProvider router={router}></RouterProvider>
                <Toaster richColors position="top-right" />
            </AuthProvider>
        </div>
    );
}

import { RouterProvider } from "react-router-dom";
import router from "./router/router";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { useEffect } from 'react';
import axios from "axios";
import { CacheProvider } from "./context/CacheProvider";

export default function App() {

    useEffect(() => {
        axios.get("/sanctum/csrf-cookie");
    }, []);

    return (
        <CacheProvider>
            <ThemeProvider>
                <AuthProvider>
                    <RouterProvider router={router}></RouterProvider>
                </AuthProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}

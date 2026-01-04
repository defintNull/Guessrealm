import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { GuestMiddleware } from "./middlewares/GuestMiddleware";


const router = createBrowserRouter([
    {
        path: "/",
        Component: DefaultLayout,
        children: [
            {
                index: true,
                Component: Home
            }
        ]
    },
    {
        path: "/login",
        element: (
            <GuestMiddleware>
                <Login />
            </GuestMiddleware>
        )
    },
    {
        path: "/register",
        element: (
            <GuestMiddleware>
                <Register />
            </GuestMiddleware>
        )
    }
]);

export default router;

import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { GuestMiddleware } from "./middlewares/GuestMiddleware";
import { AuthMiddleware } from "./middlewares/AuthMiddleware";
import Singleplayer from "@/pages/Singleplayer";
import Profile from "@/pages/Profile";
import Password from "@/pages/Password";


const router = createBrowserRouter([
    {
        path: "/",
        Component: DefaultLayout,
        children: [
            {
                index: true,
                Component: Home
            },
            {
                path: "/singleplayer",
                element: (
                    <AuthMiddleware>
                        <Singleplayer />
                    </AuthMiddleware>
                )
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
    },
    {
        path: "/profile",
        element : (
            <AuthMiddleware>
                <Profile />
            </AuthMiddleware>
        )
    },
    {
        path: "/password",
        element : (
            <AuthMiddleware>
                <Password />
            </AuthMiddleware>
        )
    },
]);

export default router;

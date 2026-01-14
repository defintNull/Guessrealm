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
import Multiplayer from "@/pages/Multiplayer";
import CreateLobby from "@/pages/CreateLobby";
import JoinLobby from "@/pages/JoinLobby";
import Lobby from "@/pages/Lobby";


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
                path: "singleplayer",
                element: (
                    <AuthMiddleware>
                        <Singleplayer />
                    </AuthMiddleware>
                )
            },
            {
                path: "multiplayer",
                children: [
                    {
                        index: true,
                        element: (
                            <AuthMiddleware>
                                <Multiplayer />
                            </AuthMiddleware>
                        ),
                    },
                    {
                        path: "createlobby",
                        element: (
                            <AuthMiddleware>
                                <CreateLobby />
                            </AuthMiddleware>
                        )
                    },
                    {
                        path: "joinlobby",
                        element: (
                            <AuthMiddleware>
                                <JoinLobby />
                            </AuthMiddleware>
                        )
                    },
                    {
                        path: "lobby",
                        element: (
                            <AuthMiddleware>
                                <Lobby />
                            </AuthMiddleware>
                        )
                    },
                ]
            }
        ]
    },
    {
        path: "login",
        element: (
            <GuestMiddleware>
                <Login />
            </GuestMiddleware>
        )
    },
    {
        path: "register",
        element: (
            <GuestMiddleware>
                <Register />
            </GuestMiddleware>
        )
    },
    {
        path: "profile",
        element : (
            <AuthMiddleware>
                <Profile />
            </AuthMiddleware>
        )
    },
    {
        path: "password",
        element : (
            <AuthMiddleware>
                <Password />
            </AuthMiddleware>
        )
    },
]);

export default router;

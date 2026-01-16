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
import { LobbyProvider } from "@/context/LobbyProvider";
import { LobbyMiddleware } from "./middlewares/LobbyMiddleware";
import Testchat from "@/pages/Testchat";


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
                                <LobbyProvider>
                                    <CreateLobby />
                                </LobbyProvider>
                            </AuthMiddleware>
                        )
                    },
                    {
                        path: "joinlobby",
                        element: (
                            <AuthMiddleware>
                                <LobbyProvider>
                                    <JoinLobby />
                                </LobbyProvider>
                            </AuthMiddleware>
                        )
                    },
                    {
                        path: "lobby",
                        element: (
                            <AuthMiddleware>
                                <LobbyProvider>
                                    <LobbyMiddleware>
                                        <Lobby />
                                    </LobbyMiddleware>
                                </LobbyProvider>
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
    {
        path: "testchat",
        element : (
            <AuthMiddleware>
                <Testchat />
            </AuthMiddleware>
        )
    },
]);

export default router;

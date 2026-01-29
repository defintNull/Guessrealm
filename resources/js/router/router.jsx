import { createBrowserRouter, Outlet } from "react-router-dom";
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
import { MultiplayerGameProvider } from "@/context/MultiplayerGameProvider";
import { MultiplayerGameMiddleware } from "./middlewares/MultiplayerGameMiddleware";
import MultiplayerGame from "@/pages/MultiplayerGame";
import Chat from "@/pages/Chat";
import NotFound from "@/pages/NotFound";
import Statistics from "@/pages/Statistics";


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
                element: (
                    <AuthMiddleware>
                        <LobbyProvider>
                            <MultiplayerGameProvider>
                                <Outlet />
                            </MultiplayerGameProvider>
                        </LobbyProvider>
                    </AuthMiddleware>
                ),
                children: [
                    {
                        index: true,
                        element: (
                            <Multiplayer />
                        ),
                    },
                    {
                        path: "createlobby",
                        element: (
                            <CreateLobby />
                        )
                    },
                    {
                        path: "joinlobby",
                        element: (
                            <JoinLobby />
                        )
                    },
                    {
                        path: "lobby",
                        element: (
                            <LobbyMiddleware>
                                <Lobby />
                            </LobbyMiddleware>
                        )
                    },
                    {
                        path: "game",
                        element: (
                            <MultiplayerGameMiddleware>
                                <MultiplayerGame />
                            </MultiplayerGameMiddleware>
                        )
                    },
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
                path: "statistics",
                element : (
                    <AuthMiddleware>
                        <Statistics />
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
                path: "chat",
                element : (
                    <AuthMiddleware>
                        <Chat />
                    </AuthMiddleware>
                )
            },
        ]
    },
    {
        path: "*",
        element : (
            <NotFound />
        )
    }
]);

export default router;

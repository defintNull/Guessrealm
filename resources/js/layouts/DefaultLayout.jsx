import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useRef } from "react";

import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
    NavigationMenuContent
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { IoChatbubbles, IoChatbubblesOutline } from "react-icons/io5";

export default function DefaultLayout() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const [ menuOpen, setMenuOpen ] = useState(false);
    const [ chatHover, setChatHover ] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    function avatarOnClick() {
        setMenuOpen(prev => !prev);
    }

    async function logoutCallback() {
        try{
            await axios.post('/spa/logout');
            setUser(null);
            navigate("/", { replace: true });
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Logout failed");
        }
    }

    return (
        <div className="flex flex-col w-full min-h-svh py-4 px-8">
            <Toaster position="top-right" richColors />
            <div className="flex justify-end items-center gap-x-5 pr-4 py-2 z-10">
                {user && (
                    <div onMouseOver={() => {setChatHover(true)}} onMouseOut={() => {setChatHover(false)}} className="flex flex-col items-center justify-center hover:cursor-pointer">
                        {chatHover ? (
                            <Link to="/chat" asChild >
                                <IoChatbubbles className="h-8 w-8" />
                            </Link>
                        ) : (
                            <Link to="/chat" asChild >
                                <IoChatbubblesOutline className="h-8 w-8" />
                            </Link>
                        )}
                    </div>
                )}
                <NavigationMenu>
                    {user ? (
                        <NavigationMenuItem className="md:block relative" ref={menuRef}>
                            <Avatar className="h-10 w-10 cursor-pointer hover:shadow-lg transition-shadow" onClick={avatarOnClick}>
                                <AvatarImage src={user.profile_picture_url} />
                                <AvatarFallback>{(user.name[0] + user.surname[0]).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Card className={`px-1 py-2 mt-2 min-w-fit absolute left-0 right-0 ${!menuOpen && "hidden"}`}>
                                <NavigationMenuList className="flex-col">
                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link to="/profile">Profile</Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavigationMenuLink className="cursor-pointer" onClick={logoutCallback}>
                                            Logout
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </Card>
                        </NavigationMenuItem>
                    ) : (
                        <NavigationMenuList className="gap-4">
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link to="/login">Login</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link to="/register">Register</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    )}
                </NavigationMenu>
            </div>
            <main className="flex flex-col grow">
                <Outlet />
            </main>
        </div>
    );
}

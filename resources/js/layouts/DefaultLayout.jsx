import { Link, Outlet } from "react-router-dom";
import { useState } from "react";

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

export default function DefaultLayout() {
    const { user, setUser } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    function avatarOnClick() {
        setMenuOpen(prev => !prev);
    }

    async function logoutCallback() {
        try{
            await axios.post('/spa/logout');
            setUser(null);
        } catch (error) {
        }
    }

    return (
        <div className="flex flex-col w-full min-h-svh py-4 px-8">
            <div className="flex justify-end pr-4 py-2 z-10">
                <NavigationMenu>
                    {user ? (
                        <NavigationMenuItem className="md:block relative">
                            <Avatar className="h-10 w-10 cursor-pointer hover:shadow-lg transition-shadow" onClick={avatarOnClick}>
                                <AvatarImage src="/spa/profilepicture" />
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

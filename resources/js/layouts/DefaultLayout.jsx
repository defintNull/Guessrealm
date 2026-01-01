import { Link, Outlet } from "react-router-dom";

import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export default function DefaultLayout() {
  return (
    <div className="flex flex-col w-full min-h-svh py-4 px-8">
        <div className="flex justify-end pr-4 py-2">
            <NavigationMenu>
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
            </NavigationMenu>
        </div>
        <main className="flex flex-col grow">
            <Outlet />
        </main>
    </div>
  );
}

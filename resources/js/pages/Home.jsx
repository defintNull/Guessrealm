import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";


export default function Home() {
    return <div className="flex flex-col w-full grow justify-center items-center gap-y-12">
        <Button asChild variant="default" className="h-30 w-80 text-3xl">
            <Link to="/singleplayer">Singleplayer</Link>
        </Button>
        <Button asChild variant="secondary" className="h-30 w-80 text-3xl">
            <Link to="/Multiplayer">Multiplayer</Link>
        </Button>
    </div>;
}

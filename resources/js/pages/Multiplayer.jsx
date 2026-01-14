import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Multiplayer() {
    return <div className="flex grow flex-col items-center justify-center w-full h-full">
        <div className="flex flex-row w-2/3 justify-between">
            <Button asChild variant="default" className="h-30 w-80 text-3xl">
                <Link to="/multiplayer/createlobby">Create Lobby</Link>
            </Button>

            <Button asChild variant="secondary" className="h-30 w-80 text-3xl">
                <Link to="/multiplayer/joinlobby">Join Lobby</Link>
            </Button>
        </div>
    </div>
}

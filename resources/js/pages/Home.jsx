import { Button } from "@/components/ui/button";
import { Accordion,
        AccordionItem,
        AccordionTrigger,
        AccordionContent,
        } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { useState } from "react";
import InfoOverlay from "@/components/InfoOverlay";


export default function Home() {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative flex flex-col w-full grow justify-center items-center gap-y-12">
            <InfoOverlay />

            <div className="flex flex-col items-center gap-2 mt-8">
                <img
                    src="images/favicon.png"
                    alt="Logo"
                    className="w-32 h-auto"
                />

                <p
                className="text-6xl"
                style={{ fontFamily: "Chewy" }}
                >
                    Guessrealm
                </p>
            </div>

            <Button asChild variant="default" className="h-30 w-80 text-3xl">
                <Link to="/singleplayer">Singleplayer</Link>
            </Button>

            <Button asChild variant="secondary" className="h-30 w-80 text-3xl">
                <Link to="/multiplayer">Multiplayer</Link>
            </Button>
        </div>
    );

}

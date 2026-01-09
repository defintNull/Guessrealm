import { useState } from "react";
import { Card } from "./ui/card";
import { ImCross } from "react-icons/im";

export default function Photo({ src, name = "Pippo", alt = "", className = "", state=false, animated = false, ...props }) {
    const [ loaded, setLoaded ] = useState(false);

    return (
        <Card {...props} className={"w-full h-full gap-y-1 relative flex flex-col items-center justify-center overflow-hidden px-2 py-2 " + className}>
            {!loaded && (
                <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-xl" />
            )}
            <ImCross className={"absolute w-full h-full p-4 " + (!state ? "hidden" : "")} color="red" />
            <img
                className={
                    "w-full h-4/5 object-contain rounded-xl transition-opacity duration-300 " +
                    (loaded ? "opacity-100" : "opacity-0") +
                    ((!state && animated) ? " animate-glow" : "")
                }
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
            />
            <p className="flex-1">{name}</p>
        </Card>
    );
}

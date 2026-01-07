import { useState } from "react";
import { Card } from "./ui/card";
import { ImCross } from "react-icons/im";

export default function Photo({ src, alt = "", className = "", state=false, ...props }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Card {...props} className={"w-full h-full relative flex flex-col items-center justify-center overflow-hidden px-2 py-2 " + className}>
            {!loaded && (
                <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-xl" />
            )}
            <ImCross className={"absolute w-full h-full p-4 " + (!state ? "hidden" : "")} color="red" />
            <img
                className={
                    "w-fit h-full object-contain rounded-xl transition-opacity duration-300 " +
                    (loaded ? "opacity-100" : "opacity-0")
                }
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
            />
        </Card>
    );
}

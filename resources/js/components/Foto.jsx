import { useState } from "react";
import { Card } from "./ui/card";

export default function Foto({ src, alt = "", className = "" }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Card className={"w-full h-full relative flex flex-col items-center justify-center overflow-hidden px-2 py-2 " + className}>
            {!loaded && (
                <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-xl" />
            )}

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

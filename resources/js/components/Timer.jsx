import { Card } from "./ui/card";
import { FaForward } from "react-icons/fa";
import { useState } from 'react';

export default function Timer({time, clickEnable=false, onClick, ...props}) {
    const [ over, setHover ] = useState(false);

    const m = String(Math.floor(time / 60)).padStart(2, "0");
    const s = String(time % 60).padStart(2, "0");

    return <Card onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onClick={(clickEnable ? onClick : null)}
        className={"items-center justify-center px-4 py-2 min-w-17 " + (clickEnable ? "cursor-pointer" : "")}
    >
        {(over && clickEnable) ? (
            <FaForward />
        ) : (
            <p>{m}:{s}</p>
        )}
    </Card>
}

import Foto from '@/components/foto';
import { Card } from '@/components/ui/card';
import axios from 'axios'
import { useEffect, useState } from 'react'

export default function Singleplayer() {
    const [ fotos, setFotos ] = useState([]);
    useEffect(() => {
        (async () => {
            let res = await axios.post("/spa/game/fotos");
            setFotos(res.data?.fotos.map(el => ({id:el?.id, path:"/spa/game/foto/show/" + el?.id})));
        })();
    }, [])

    return <div>
        <div className="grid grid-cols-6 grid-rows-4 h-svh">
            {fotos.map(el => {
                return <Foto key={el.id} src={el.path} />
            })}
        </div>
    </div>
}

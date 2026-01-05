import Photo from '@/components/Photo';
import { Card } from '@/components/ui/card';
import axios from 'axios'
import { useEffect, useState } from 'react'

export default function Singleplayer() {
    const [ photos, setPhotos ] = useState([]);
    useEffect(() => {
        (async () => {
            let res = await axios.post("/spa/game/photos");
            setPhotos(res.data?.photos.map(el => ({id:el?.id, path:"/spa/game/photo/show/" + el?.id})));
        })();
    }, [])

    return <div>
        <div className="grid grid-cols-6 grid-rows-4 h-svh">
            {photos.map(el => {
                return <Photo key={el.id} src={el.path} />
            })}
        </div>
    </div>
}

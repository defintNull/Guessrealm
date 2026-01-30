import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { useState, useEffect } from "react";

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useNavigate } from "react-router-dom";
import { useEnableLobby } from "@/context/LobbyProvider";
import { TbReload } from "react-icons/tb";


export default function JoinLobby() {
    const navigate = useNavigate();
    const { setEnableLobby } = useEnableLobby();

    const [ lobbies, setLobbies ] = useState([]);
    const [ filterVisibility, setFilterVisibility ] = useState(0);
    const [ dialogLobbyState, setDialogLobbyState ] = useState(false);
    const [ dialogLobbyPassword, setDialogLobbyPassword ] = useState(false);
    const [ passwordCode, setPasswordCode ] = useState(null);
    const [ selecteddLobby, setSelectedlobby ] = useState(null);
    const [ dialogLobbyWrongPassword, setDialogLobbyWrongPassword ] = useState(false);
    const [ reload, setReload ] = useState(false);

    useEffect(() => {
        axios.get('/spa/lobby/index')
            .then((res) => {
                setLobbies(res.data?.lobbies);
            });
    }, []);

    useEffect(() => {
        axios.get('/spa/lobby/index', {
            params: { visibility: filterVisibility, },
        }).then((res) => {
            setLobbies(res.data?.lobbies);
        });
    }, [filterVisibility]);

    function searchSubmitHandler(event) {
        if (event.key === "Enter") {
            const query = event.target.value;
            axios.get("/spa/lobby/index", {
                params: { name: query }
            }).then((res) => {
                setLobbies(res.data?.lobbies);
            });
        }
    }

    function joinClickHandler(event, lobby_id) {
        let lobby = lobbies.find(el => el.id == lobby_id);
        if(lobby.visibility == 1) {
            setSelectedlobby(lobby);
            setDialogLobbyPassword(true);
            return;
        }
        axios.post("/spa/lobby/joinlobby", {
            id: lobby_id
        }).then((res) => {
            if(res.data.response) {
                setEnableLobby(true);
                navigate("/multiplayer/lobby", {
                    state: {
                        lobby_type: 1,
                        lobby_id: res.data.lobby_id,
                        lobby_websocket: res.data.lobby_websocket
                    }
                });
            } else {
                setDialogLobbyState(true);
            }
        });
    }

    function dialogLobbyStateClickHandle() {
        axios.get('/spa/lobby/index')
            .then((res) => {
                setLobbies(res.data?.lobbies);
            });
        setDialogLobbyState(false);
    }

    function dialogLobbyPasswordConfirmClickHandle() {
        axios.post("/spa/lobby/joinlobby", {
            id: selecteddLobby.id,
            password: passwordCode
        }).then((res) => {
            if(res.data.response) {
                setEnableLobby(true);
                navigate("/multiplayer/lobby", {
                    state: {
                        lobby_type: 1,
                        lobby_id: res.data.lobby_id,
                        lobby_websocket: res.data.lobby_websocket
                    }
                });
            } else {
                setDialogLobbyPassword(false);
                setDialogLobbyWrongPassword(true);
            }
        });
    }

    function dialogLobbyPasswordUndoClickHandle() {
        setSelectedlobby(null);
        setDialogLobbyPassword(false);
    }

    function dialogLobbyWrongPasswordClickHandle() {
        setDialogLobbyWrongPassword(false);
        setDialogLobbyPassword(true);
    }

    function reloadHandle() {
        setLobbies([]);
        setReload(true);
        axios.get('/spa/lobby/index')
        .then((res) => {
            setLobbies(res.data?.lobbies);
            setReload(false)
        });
    }

    return <div className="flex flex-col items-center justify-center w-full grow">
        <Card className="w-1/2 px-6 py-8">
            <CardHeader>
                <CardTitle className="text-center font-bold text-2xl">Join Lobby</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="flex flex-row items-center justify-center pb-4 gap-x-4">
                    <TbReload className={`h-12 w-12 cursor-pointer ${reload ? "animate-spin" : ""}`} onClick={reloadHandle}/>
                    <p className="text-lg">Lobbies:</p>
                    <Input type="text" placeholder="Find lobby..." onChange={searchSubmitHandler}></Input>
                    <Select value={filterVisibility} onValueChange={(v) => {setFilterVisibility(v)}}>
                        <SelectTrigger className="w-45">
                            <SelectValue placeholder="Filter..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Visibility</SelectLabel>
                                <SelectItem value={0}>All</SelectItem>
                                <SelectItem value={1}>Public</SelectItem>
                                <SelectItem value={2}>Private</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <ScrollArea className="h-74 border-2 px-4">
                    <table className="w-full text-left table-fixed">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                            <tr className="border-b">
                                <th className="py-2">Name</th>
                                <th className="py-2 text-center">Visibility</th>
                                <th className="py-2 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {lobbies.map(el => {
                                return <tr key={el.id} className="border-b">
                                            <td className="py-2">{el.name}</td>
                                            <td className="py-2 text-center">{(el.visibility == 0) ? "Public" : "Private"}</td>
                                            <td className="py-2 text-right">
                                                <Button onClick={(event) => joinClickHandler(event, el.id)} className="cursor-pointer">Join</Button>
                                            </td>
                                        </tr>
                            })}
                        </tbody>
                    </table>
                </ScrollArea>
            </CardContent>
        </Card>
        {/* Modals */}
        <Dialog open={dialogLobbyState}>
            <VisuallyHidden>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
            </VisuallyHidden>
            <DialogContent showCloseButton={false}>
                <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-4xl font-semibold py-4 text-center">The lobby is already full!</p>
                    <Button size="lg" className="w-1/2 mt-6 cursor-pointer" onClick={dialogLobbyStateClickHandle}>Confirm</Button>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={dialogLobbyPassword}>
            <VisuallyHidden>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
            </VisuallyHidden>
            <DialogContent showCloseButton={false}>
                <div className="flex flex-col items-center justify-center py-4 gap-y-6">
                    <p className="text-4xl font-semibold text-center">Private Lobby</p>
                    <div className="w-full flex flex-col items-center justify-center">
                        <p className="text-2xl font-semibold py-4 text-center">{selecteddLobby?.name || "Pinco_palla_gdvagvsga"}</p>
                        <Input className="w-2/3" type="text" placeholder="Insert code..." onChange={(e) => {setPasswordCode(e.target.value)}} ></Input>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-x-10 w-full">
                        <Button size="lg" className="mt-6 cursor-pointer" onClick={dialogLobbyPasswordConfirmClickHandle}>Confirm</Button>
                        <Button size="lg" className="mt-6 cursor-pointer" onClick={dialogLobbyPasswordUndoClickHandle}>Undo</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={dialogLobbyWrongPassword}>
            <VisuallyHidden>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
            </VisuallyHidden>
            <DialogContent showCloseButton={false}>
                <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-4xl font-semibold py-4 text-center">Wrong password code!</p>
                    <Button size="lg" className="w-1/2 mt-6 cursor-pointer" onClick={dialogLobbyWrongPasswordClickHandle}>Confirm</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
}

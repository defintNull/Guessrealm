import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useEcho } from "@laravel/echo-react";
import axios from "axios";
import { useEnableLobby } from "@/context/LobbyProvider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import Timer from "@/components/Timer";

export default function Lobby() {
    const navigate = useNavigate();
    const { setEnableLobby } = useEnableLobby();
    const { state } = useLocation();

    const [ lobbyID, setLobbyID ] = useState(state.lobby_id);
    const [ lobbyName, setLobbyName ] = useState(null);
    const [ lobbyCode, setLobbyCode ] = useState(null);
    const [ players, setPlayers ] = useState(null);
    const [ lobbyMode, setLobbyMode ] = useState(state.lobby_type); // 0 Owner 1 Guest
    const [ timer, setTimer] = useState(5*60);

    const [ buttonToggle, setButtonToggle ] = useState(false);

    const [ dialogLobbyState, setDialogLobbyState ] = useState(false);

    useEffect(() => {
        axios.get('/spa/lobby/show', {
            params: {
                id: lobbyID
            }
        }).then((res) => {
            setLobbyName(res.data.lobby.name);
            setLobbyCode(res.data.lobby.code);
            setPlayers(res.data.lobby.players);
        });
    }, []);

    // Timer
    useEffect(() => {
        if (timer <= 0) {
            axios.get('/spa/lobby/timer', {
                params: {
                    id: lobbyID
                }
            }).finally(() => {
                setDialogLobbyState(true);
            });
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    // Effect to enable or disable the start button based on the number of player and ready state
    if(lobbyMode == 0) {
        useEffect(() => {
            if(players != null && players.filter(el => el.status).length == 2) {
                setButtonToggle(true);
            } else {
                setButtonToggle(false);
            }
        }, [players]);
    }

    // Websocket
    useEcho(
        state.lobby_websocket,
        'LobbyEvent',
        (e) => {
            if(lobbyMode == 0) {
                if(e.action == "JOIN") {
                    setPlayers(prev => [
                        ...prev,
                        {
                            id: e.user.id,
                            username: e.user.username,
                            profile_picture_path: e.user.profile_picture_path,
                            profile_picture_mime: e.user.profile_picture_mime,
                            status: false
                        }
                    ]);
                } else if(e.action == "EXIT") {
                    setPlayers(prev => {
                        return prev.filter(el => {
                            return el.id != e.user.id;
                        })
                    });
                } else if(e.action == "READY") {
                    setPlayers(prev =>
                        prev.map(el =>
                            el.id === e.user.id
                                ? { ...el, status: e.ready }
                                : el
                        )
                    );
                }
            } else {
                if(e.action == "DELETE") {
                    setDialogLobbyState(true);
                }
            }
        }
    );

    // Click handle to start the game
    function actionButtonClickHandle(e) {
        if(lobbyMode == 0) {
            if(buttonToggle) {

            }
        } else {
            axios.post('/spa/lobby/setready', {
                id: lobbyID,
                ready: !buttonToggle
            }).then((res) => {
                setButtonToggle(!buttonToggle);
                setPlayers(prev => prev.map(el => {
                        if(el.id == res.data.user.id) {
                            return { ...el, status: !el.status }
                        }
                        return el
                    })
                );
            });
        }
    }

    function exitClickHandle(e) {
        e.preventDefault();
        if(lobbyMode == 0) {
            axios.post('/spa/lobby/deletelobby', {
                id: lobbyID
            }).finally(() => {
                setEnableLobby(false);
                navigate('/');
            });
        } else {
            axios.post('/spa/lobby/exitlobby', {
                id: lobbyID
            }).finally(() => {
                setEnableLobby(false);
                navigate('/');
            });
        }
    }

    function dialogLobbyStateClickHandle() {
        setEnableLobby(false);
        navigate('/');
    }

    return <div className="grow flex flex-col items-center justify-center">
        <Card className="w-2/3 py-12 px-6">
            <CardHeader className="pb-10">
                <CardTitle className="text-center text-3xl font-bold">Lobby</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-y-12">
                <div className="flex flex-col items-center justify-center w-full gap-y-8">
                    <div className="flex flex-col items-center justify-center w-full gap-y-4">
                        <p className="flex flex-row w-4/5 justify-between font-semibold text-xl">
                            <span>Lobby name:</span>
                            <span>{ lobbyName }</span>
                        </p>
                        <p className="flex flex-row w-4/5 justify-between font-semibold text-xl">
                            <span>Lobby code:</span>
                            <span>{ lobbyCode }</span>
                        </p>
                    </div>
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex flex-row justify-between">
                                <span>Player List:</span>
                                <span>{ players != null ? players.length + "/2" : "1/2" }</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-y-4 px-4">
                                {players == null ? null : players.map(el => {
                                    return <div key={el?.id} className="flex flex-row items-center gap-x-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={el?.profile_picture_path} />
                                                    <AvatarFallback>
                                                        {el?.username?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className="flex flex-row justify-between w-full">
                                                    <span>{el?.username || "Giampiero"}</span>
                                                    <span>{el?.status ? "READY" : ""}</span>
                                                </p>
                                            </div>
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-row w-full justify-end gap-x-4 pr-8">
                    <Timer time={timer} />
                    <div className="grow" />
                    <Button className="cursor-pointer" onClick={exitClickHandle}>Exit</Button>
                    <Button className={ (lobbyMode == 1 || buttonToggle) ? "cursor-pointer" : "" }
                            onClick={actionButtonClickHandle}
                            variant = {(lobbyMode == 1 || buttonToggle) ? "default" : "ghost"}>
                                {lobbyMode == 0 ? (buttonToggle ? "Start" : "Waiting...") : (buttonToggle ? "Unready" : "Ready")}
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Dialog open={dialogLobbyState}>
            <VisuallyHidden>
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
            </VisuallyHidden>
            <DialogContent showCloseButton={false}>
                <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-4xl font-semibold py-4 text-center">The lobby has being closed!</p>
                    <Button size="lg" className="w-1/2 mt-6 cursor-pointer" onClick={dialogLobbyStateClickHandle}>Confirm</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
}

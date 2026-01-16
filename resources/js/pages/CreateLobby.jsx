import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnableLobby } from "@/context/LobbyProvider";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateLobby() {
    const navigate = useNavigate();
    const { setEnableLobby } = useEnableLobby();
    const [ visibility, setVisibility ] = useState(0);
    const [ aiHelp, setAiHelp ] = useState(0);
    const [ timeout, setTimeout ] = useState(1);

    function formSubmit(event) {
        event.preventDefault();

        axios.post('/spa/lobby/createlobby', {
            lobby_visibility: visibility,
            ai_help: aiHelp,
            timeout: timeout
        }).then((res) => {
            setEnableLobby(true);
            navigate("/multiplayer/lobby", {
                state: {
                    lobby_type: 0,
                    lobby_id: res.data.lobby_id,
                    lobby_websocket: res.data.lobby_websocket
                }
            });
        });
    }

    return <form onSubmit={formSubmit} className="flex flex-col grow items-center justify-center w-full">
        <Card className="w-2/3 py-10 px-4">
            <CardHeader>
                <CardTitle className="text-2xl">Create Lobby</CardTitle>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel>Lobby visibility</FieldLabel>
                            <FieldDescription>Choose set the lobby private or public.<br/>Private lobby can be accessed only with the given code.</FieldDescription>
                        </FieldContent>
                        <Select value={String(visibility)} onValueChange={(v) => {setVisibility(Number(v))}}>
                            <SelectTrigger>
                                <SelectValue placeholder="Lobby Visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Public</SelectItem>
                                <SelectItem value="1">Private</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel>Ai Help</FieldLabel>
                            <FieldDescription>Choose if enable ai help during the game.</FieldDescription>
                        </FieldContent>
                        <Select value={String(aiHelp)} onValueChange={(v) => {setAiHelp(Number(v))}}>
                            <SelectTrigger>
                                <SelectValue placeholder="Ai Help" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Off</SelectItem>
                                <SelectItem value="1">On</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel>Timeout</FieldLabel>
                            <FieldDescription>Choose the limit time for an action during the game.</FieldDescription>
                        </FieldContent>
                        <Select value={String(timeout)} onValueChange={(v) => {setTimeout(Number(v))}}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose Timeout" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.5">30 sec</SelectItem>
                                <SelectItem value="1">1 min</SelectItem>
                                <SelectItem value="2">2 min</SelectItem>
                                <SelectItem value="3">3 min</SelectItem>
                                <SelectItem value="5">5 min</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>
                <div className="flex flex-row w-full justify-end gap-x-4 pt-10">
                    <Button className="cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        navigate("/");
                    }}>Annulla</Button>
                    <Button className="cursor-pointer">Create</Button>
                </div>
            </CardContent>
        </Card>
    </form>
}

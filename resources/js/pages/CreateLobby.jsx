import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateLobby() {
    return <form className="flex flex-col grow items-center justify-center w-full">
        <Card className="w-2/3 py-10 px-4">
            <CardHeader>
                <CardTitle className="text-2xl">Create Lobby</CardTitle>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel>Lobby visibility</FieldLabel>
                            <FieldDescription>Choose set the lobby private or public.<br/>Private lobby can be accessed only with the given password.</FieldDescription>
                        </FieldContent>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Lobby Visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={0}>Public</SelectItem>
                                <SelectItem value={1}>Private</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel>Ai Help</FieldLabel>
                            <FieldDescription>Choose if enable ai help during the game.</FieldDescription>
                        </FieldContent>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Ai Help" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={0}>Off</SelectItem>
                                <SelectItem value={1}>On</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel>Timeout</FieldLabel>
                            <FieldDescription>Choose the limit time for an action during the game.</FieldDescription>
                        </FieldContent>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose Timeout" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={0.5}>30 sec</SelectItem>
                                <SelectItem value={1}>1 min</SelectItem>
                                <SelectItem value={2}>2 min</SelectItem>
                                <SelectItem value={3}>3 min</SelectItem>
                                <SelectItem value={5}>5 min</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>
                <div className="flex flex-row w-full justify-end gap-x-4 pt-10">
                    <Button>Annulla</Button>
                    <Button>Create</Button>
                </div>
            </CardContent>
        </Card>
    </form>
}

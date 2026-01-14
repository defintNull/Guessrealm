import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Lobby() {
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
                            <span>Pinco</span>
                        </p>
                        <p className="flex flex-row w-4/5 justify-between font-semibold text-xl">
                            <span>Lobby code:</span>
                            <span>151511</span>
                        </p>
                    </div>
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex flex-row justify-between">
                                <span>Player List:</span>
                                <span>1/2</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-y-4 pl-4">
                                <div className="flex flex-row items-center gap-x-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="" />
                                        <AvatarFallback>

                                        </AvatarFallback>
                                    </Avatar>
                                    <p>PLAYER</p>
                                </div>
                                <div className="flex flex-row items-center gap-x-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="" />
                                        <AvatarFallback>

                                        </AvatarFallback>
                                    </Avatar>
                                    <p>PLAYER</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-row w-full justify-end gap-x-4 pr-8">
                    <Button>Annulla</Button>
                    <Button>Start</Button>
                </div>
            </CardContent>
        </Card>
    </div>
}

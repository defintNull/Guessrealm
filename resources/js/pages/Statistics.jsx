import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthProvider';
import { Avatar } from '@radix-ui/react-avatar';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Statistics() {
    const { user } = useAuth();

    const [ statistics, setStatistics ] = useState(null);
    const [ leaderboard, setLeaderboard ] = useState([]);
    const [ leaderboardWinners, setLeaderboardWinners ] = useState([]);

    useEffect(() => {
        axios.post('/spa/statistics/show', {
            'user_id': user?.id || "-1"
        }).then((res) => {
            setStatistics(res.data?.statistic || null);
        });
        axios.get('/spa/statistics/leaderboard')
        .then((res) => {
            setLeaderboard(res.data?.leaderboard || []);
            setLeaderboardWinners(res.data?.leaderboard_win || []);
        });
    }, []);

    return <div className="w-full h-[calc(100svh-100px)] flex flex-col items-center justify-center">
        <Card className="w-2/3">
            <CardHeader>
                <CardTitle className="text-3xl font-semibold">
                    Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 items-center justify-center px-8 gap-x-8 lg:gap-x-40">
                <div className="flex flex-col w-full items-center justify-center gap-y-10 text-xl font-semibold">
                    <div className="flex flex-col items-center justify-center w-full gap-y-4">
                        <Avatar className="h-34 w-34">
                            <AvatarImage src={user?.profile_picture_url} />
                            <AvatarFallback>
                                {user?.name?.charAt(0).toUpperCase()}
                                {user?.surname?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-center">{user?.username || 'No Username....'}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-full px-8 gap-y-4">
                        <Field className="w-full pb-10">
                            <FieldLabel htmlFor="progress-upload">
                                <span className="text-xl font-semibold">{'Level:' + (statistics?.level || 0)}</span>
                                <span className="ml-auto text-xl font-semibold">{statistics?.xp || 0}</span>
                            </FieldLabel>
                            <Progress value={statistics?.xp} id="progress-upload" />
                        </Field>
                        <div className="flex flex-row items-center justify-between w-full">
                            <p>Games:</p>
                            <p>{statistics?.games || 0}</p>
                        </div>
                        <div className="flex flex-row items-center justify-between w-full">
                            <p>Wins:</p>
                            <p>{statistics?.wins || 0}</p>
                        </div>
                        <div className="flex flex-row items-center justify-between w-full">
                            <p>Loses:</p>
                            <p>{statistics?.loses || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col w-full items-center justify-center">
                    <Tabs defaultValue="leaderboard" className="w-full">
                        <TabsList>
                            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                            <TabsTrigger value="leaderboard_wins">Leaderboard by wins</TabsTrigger>
                        </TabsList>
                        <TabsContent value="leaderboard">
                            <Card>
                            <CardHeader>
                                <CardTitle>Leaderboard</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground text-sm flex flex-col items-center justify-center">
                                <ScrollArea className="h-[calc(100svh-400px)] w-full text-lg">
                                    {leaderboard.length == 0 ? (
                                        <p>No players available...</p>
                                    ) : (
                                        leaderboard.map(el => {
                                            return <Card key={el?.username} className="w-full">
                                                <CardContent className="flex flex-row items-center justify-between">
                                                    <div className="flex flex-row items-center gap-x-2">
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src={el?.profile_picture_url} />
                                                            <AvatarFallback>
                                                                {el?.username?.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="max-w-0 lg:max-w-full truncate">{el?.username || 'No Username....'}</p>
                                                    </div>
                                                    <p>{(el?.level || 0) + " Lv."}</p>
                                                </CardContent>
                                            </Card>
                                        })
                                    )}
                                </ScrollArea>
                            </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="leaderboard_wins">
                            <Card>
                            <CardHeader>
                                <CardTitle>Leaderboard by wins</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground text-sm flex flex-col items-center justify-center">
                                <ScrollArea className="h-[calc(100svh-400px)] w-full text-lg">
                                    {leaderboardWinners.length == 0 ? (
                                        <p>No players available...</p>
                                    ) : (
                                        leaderboardWinners.map(el => {
                                            return <Card key={el?.username} className="w-full">
                                                <CardContent className="flex flex-row items-center justify-between">
                                                    <div className="flex flex-row items-center gap-x-2">
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src={el?.profile_picture_url} />
                                                            <AvatarFallback>
                                                                {el?.username?.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="max-w-0 lg:max-w-full truncate">{el?.username || 'No Username....'}</p>
                                                    </div>
                                                    <p>{(el?.wins || 0) + " W"}</p>
                                                </CardContent>
                                            </Card>
                                        })
                                    )}
                                </ScrollArea>
                            </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    </div>
}

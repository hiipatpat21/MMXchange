import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    return (
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Log in to continue to MMXswap.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" autoComplete="current-password" />
                </div>
                <Button className="w-full" disabled>
                    Log in
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    New here?{" "}
                    <Link href="/register" className="font-medium text-primary hover:underline">
                        Create an account
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage () {
    return (
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <CardTitle>Create your account</CardTitle>
                <CardDescription>
                    You'll set up your profile and skills right after.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Display name</Label>
                    <Input id="name" autoComplete="name" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" autoComplete="new-password" />
                </div>
                <Button className="w-full" disabled>
                    Sign up
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Log in
                    </Link>
                </p>                
            </CardContent>
        </Card>
    )
}
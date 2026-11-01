import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../login-form"

export default function LoginPage() {
    return (
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Log in to continue to MMXchange.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <LoginForm />
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
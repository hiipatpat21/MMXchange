import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../login-form"

export default function LoginPage() {
    return (
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <CardTitle><h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1></CardTitle>
                <CardDescription>Log in to continue to MMXchange.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <LoginForm />
                <p className="text-center text-sm text-muted-foreground">
                    New here?{" "}
                    <Link href="/register" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
                        Create an account
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}

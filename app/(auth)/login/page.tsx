import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../login-form"
import { Suspense } from "react";

async function LoginNotice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    if (params.error !== "auth_callback") return null;
    return <p role="alert" className="text-sm text-destructive">This sign-in or reset link is invalid or expired. <Link href="/forgot-password" className="underline">Request a new reset link</Link> and open it in the same browser.</p>;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    return (
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <CardTitle><h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1></CardTitle>
                <CardDescription>Log in to continue to MMXchange.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Suspense fallback={null}><LoginNotice searchParams={searchParams} /></Suspense>
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

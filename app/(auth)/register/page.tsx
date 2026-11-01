import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "../register-form"

export default function RegisterPage() {
    return (
        <Card>
            <CardHeader className="flex flex-col items-center text-center">
                <CardTitle>Create your account</CardTitle>
                <CardDescription>
                    You'll set up your profile and skills right after.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <RegisterForm />
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
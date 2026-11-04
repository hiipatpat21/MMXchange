import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "../register-form"

export default function RegisterPage() {
    return (
        <Card>
            <CardHeader className="flex flex-col items-start">
                <CardTitle><h1 className="page-heading">Find your people.</h1></CardTitle>
                <CardDescription>
                    Create an account, then add your profile and skills.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <RegisterForm />
                <p className="text-sm text-muted-foreground">An account does not mean you are officially verified as an MMSU student.</p>
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}

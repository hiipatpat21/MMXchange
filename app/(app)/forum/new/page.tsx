import Link from "next/link";
import { PostForm } from "@/components/forum/post-form";

export default function NewPostPage() {
  return <div className="mx-auto max-w-2xl space-y-6"><header className="space-y-3"><h1 className="page-heading">Start a discussion</h1><p className="text-muted-foreground">Ask a learning question or share a useful resource. Keep discussions respectful and avoid posting private information.</p></header><PostForm /><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href="/forum">Back to forum</Link></div>;
}

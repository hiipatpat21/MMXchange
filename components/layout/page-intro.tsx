export function PageIntro({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <header className="page-intro"><div className="min-w-0"><h1 className="page-heading break-words">{title}</h1><p>{description}</p></div>{children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}</header>;
}

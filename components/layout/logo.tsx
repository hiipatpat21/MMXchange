import Image from "next/image"

export function Logo ({className = ""}: {className?: string}) {
    return (
        <div className = {`flex min-w-0 items-center gap-2 ${className}`}>
            <Image
                src = "/mmsu-seal-display.webp"
                alt = "MMSU Seal"
                width = {96}
                height = {96}
                sizes = "(max-width: 639px) 56px, 64px"
                priority
                unoptimized
                className = "size-14 shrink-0 object-contain sm:size-16"
            />  
            <span className = "text-lg font-bold tracking-tight text-primary sm:text-xl">MMXchange</span>
        </div>
    )
}

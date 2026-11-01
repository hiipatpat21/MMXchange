import Image from "next/image"

export function Logo ({className = ""}: {className?: string}) {
    return (
        <div className = {`flex min-w-0 items-center gap-2 ${className}`}>
            <Image
                src = "/mmsu-seal.png"
                alt = "MMSU Seal"
                width = {72}
                height = {72}
                className = "size-10 shrink-0 object-contain sm:size-12"
            />  
            <span className = "text-base font-semibold tracking-tight text-primary sm:text-lg">MMXchange</span>
        </div>
    )
}

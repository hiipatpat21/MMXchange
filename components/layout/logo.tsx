import Image from "next/image"

export function Logo ({className = ""}: {className?: string}) {
    return (
        <div className = {`flex items-center ${className}`}>
            <Image
                src = "/mmsu-seal.png"
                alt = "MMSU Seal"
                width = {72}
                height = {72}
                className = "object-contain"
            />  
            <span className = "text-lg font-semibold text-primary"> MMXchange </span>
        </div>
    )
}
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
            {/*
                <div className = "flex size-9  items-center justify-center rounded-lg border-dashed border-primary/50 text-[10px] font-bold text-primary">
                    LOGO
                </div>
            */}
            <span className = "text-lg font-semibold text-primary"> MMXswap </span>
        </div>
    )
}
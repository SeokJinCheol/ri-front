import { useId } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'

const GradientIcon = ({ icon: Icon, ...props }: LucideProps & { icon: LucideIcon }) => {
    const id = useId()

    return (
        <Icon {...props} stroke={`url(#${id})`} aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#06b6d4" />
                    <stop offset="0.5" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
            </defs>
        </Icon>
    )
}

export default GradientIcon

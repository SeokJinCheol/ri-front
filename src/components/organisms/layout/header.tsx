import { DisplayControls } from '@/components/molecules/display-controls';
import {SidebarTrigger} from "@/components/atoms/sidebar.tsx";

const Header = () => {

    return (
        <div className="flex items-center gap-4 px-4 py-2 bg-background border-b border-border">
            <SidebarTrigger />

            <DisplayControls />

        </div>
    )
}

export default Header

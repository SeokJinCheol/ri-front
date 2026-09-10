import {useTheme} from "@/providers/theme-provider.tsx";
import {SidebarTrigger} from "@/components/atoms/sidebar.tsx";

const Header = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <div className="flex items-center gap-4 px-4 py-2 bg-background border-b border-border">
            <SidebarTrigger />

            <span className="cursor-pointer material-icon !text-[18px]" onClick={toggleTheme}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>

        </div>
    )
}

export default Header

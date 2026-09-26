import { Languages, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useTheme } from '@/providers/theme-provider'
import { useLocale } from '@/providers/locale-provider'

export function DisplayControls() {
    const { theme, setTheme } = useTheme()
    const { locale, setLocale, t } = useLocale()
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const themeLabel = t(dark ? 'common.lightMode' : 'common.darkMode')
    const languageLabel = t('common.switchLanguage')
    return <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={themeLabel} title={themeLabel}>
            {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')} aria-label={languageLabel} title={languageLabel}>
            <Languages className="size-4" aria-hidden="true" /><span className="text-xs font-medium" aria-hidden="true">{locale === 'ko' ? 'KO' : 'EN'}</span>
        </Button>
    </div>
}

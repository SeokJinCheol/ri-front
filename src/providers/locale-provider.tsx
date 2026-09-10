import React, { createContext, useContext, useState } from "react";

export type Locale = "ko" | "en";

const dictionary = {
    ko: {
        common: {
            confirm: "확인",
            cancel: "취소",
            save: "저장",
            settings: "설정",
        },
    },
    en: {
        common: {
            confirm: "Confirm",
            cancel: "Cancel",
            save: "Save",
            settings: "Settings",
        },
    },
} as const;

type TranslationPath = "common.confirm" | "common.cancel" | "common.save" | "common.settings";

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationPath) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
                                   children,
                                   defaultLocale = "ko",
                                   storageKey = "app-locale",
                               }: {
    children: React.ReactNode;
    defaultLocale?: Locale;
    storageKey?: string;
}) {
    const [locale, setLocale] = useState<Locale>(
        () => (localStorage.getItem(storageKey) as Locale) || defaultLocale
    );

    const changeLocale = (nextLocale: Locale) => {
        localStorage.setItem(storageKey, nextLocale);
        setLocale(nextLocale);
    };

    const t = (path: TranslationPath): string => {
        const [section, key] = path.split(".") as [keyof typeof dictionary["ko"], string];
        const targetSection = dictionary[locale]?.[section] as Record<string, string> | undefined;
        return targetSection?.[key] || path;
    };

    return (
        <LocaleContext.Provider value={{ locale, setLocale: changeLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

export const useLocale = () => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error("useLocale must be used within a LocaleProvider");
    }
    return context;
};
/// <reference types="vite/client" />
declare module 'virtual:translations' {
    const dictionaries: Record<'ko' | 'en', Record<string, string>>
    export default dictionaries
}

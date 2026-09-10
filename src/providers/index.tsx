import { composeProviders } from "./compose-providers";
import { ThemeProvider } from "./theme-provider";
import { LocaleProvider } from "./locale-provider";
import { AuthProvider } from "./auth-provider";

// 래퍼 컴포넌트가 필요한 Provider는 작은 단위로 정의
const ConfiguredThemeProvider = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        {children}
    </ThemeProvider>
);

// 바깥쪽에서부터 감싸질 순서대로 배열에 나열
export const AppProviders = composeProviders([
    ConfiguredThemeProvider, // 가장 바깥 (테마)
    LocaleProvider,          // 다국어
    AuthProvider,            // 인증 세션
]);
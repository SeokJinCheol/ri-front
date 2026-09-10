import { ComponentType, ReactNode } from "react";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

export function composeProviders(providers: ProviderComponent[]) {
    return function ComposedProviders({ children }: { children: ReactNode }) {
        return providers.reduceRight(
            (acc, Provider) => <Provider>{acc}</Provider>,
            children
        );
    };
}
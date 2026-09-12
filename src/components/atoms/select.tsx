import { Children, isValidElement, type ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps {
    id?: string
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
    required?: boolean
    name?: string
    className?: string
    children: ReactNode
}

// Accept option children so labels and dynamic lists stay together at the call site.
export function Select({ id, value, onValueChange, disabled, required, name, className, children }: SelectProps) {
    const options = Children.toArray(children).filter(isValidElement<{ value: string; disabled?: boolean; children: ReactNode }>)
    const placeholder = options.find((option) => option.props.value === '')?.props.children
    return <SelectPrimitive.Root value={value} onValueChange={(next) => onValueChange(next === '__empty__' ? '' : next)} disabled={disabled} required={required} name={name}>
        <SelectPrimitive.Trigger id={id} className={cn(
            'relative flex h-10 w-full min-w-0 items-center rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm transition-colors hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span:first-child]:min-w-0 [&>span:first-child]:truncate',
            className,
            'pl-3 pr-12',
        )}>
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content position="popper" side="bottom" align="start" sideOffset={8} alignOffset={0} avoidCollisions={false} hideWhenDetached
                className="z-50 w-[var(--radix-select-trigger-width)] origin-top overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
                <SelectPrimitive.Viewport className="max-h-64 overflow-y-auto p-1">
                    {options.map(({ props }) => <SelectPrimitive.Item key={props.value} value={props.value || '__empty__'} disabled={props.disabled}
                        className="relative flex min-h-9 cursor-default select-none items-center rounded-md py-2 pl-3 pr-9 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <SelectPrimitive.ItemText><span className="break-all">{props.children}</span></SelectPrimitive.ItemText>
                        <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center"><Check className="size-4" /></SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>)}
                </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
}

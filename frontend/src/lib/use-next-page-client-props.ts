'use client';
import { use } from 'react';
export function useNextPageClientProps(props: {
    params?: Promise<Record<string, string | string[] | undefined>>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): void {
    use(props.params ?? Promise.resolve({}));
    use(props.searchParams ?? Promise.resolve({}));
}

export function UnityGuardMark({ className = "h-7 w-7" }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
            <path
                d="M32 4c10 7 19 8 26 10v19c0 16-11 24-26 27C17 57 6 49 6 33V14c7-2 16-3 26-10Z"
                fill="currentColor"
                opacity="0.95"
            />
            <path d="M24 28a8 8 0 1 1 16 0v12H24V28Z" fill="black" opacity="0.35" />
            <path d="M24 40h16v10H24V40Z" fill="black" opacity="0.25" />
        </svg>
    );
}

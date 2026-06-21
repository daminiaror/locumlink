type CountBadgeProps = {
    count: number;
    variant?: 'default' | 'sidebar' | 'tab';
    className?: string;
};

export function CountBadge({ count, variant = 'default', className }: CountBadgeProps) {
    if (count <= 0)
        return null;
    const label = count > 99 ? '99+' : String(count);
    const variantClass = variant === 'default' ? '' : ` count-badge--${variant}`;
    const extraClass = className ? ` ${className}` : '';
    return (
        <span
            className={`count-badge${variantClass}${extraClass}`}
            aria-label={`${count} items`}
        >
            {label}
        </span>
    );
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-[var(--surface-elevated)] text-[var(--ink-secondary)]',
  success: 'bg-[var(--success)]/10 text-[var(--success)]',
  warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  error: 'bg-[var(--error)]/10 text-[var(--error)]',
  info: 'bg-[var(--accent)]/10 text-[var(--accent)]',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
import { ButtonHTMLAttributes, forwardRef } from 'react';

type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  'aria-label': string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary:
    'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]',
  secondary:
    'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]',
  ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]',
  danger: 'bg-[var(--error)] text-white hover:opacity-90',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9',
  lg: 'w-11 h-11 text-lg',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { variant = 'ghost', size = 'md', className = '', children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center
          rounded-[var(--radius-md)]
          transition-colors duration-[var(--transition-fast)]
          cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

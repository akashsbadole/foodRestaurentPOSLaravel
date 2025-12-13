export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center px-4 py-2 bg-navy-surface border border-navy-primary rounded-md font-semibold text-xs text-navy-primary uppercase tracking-widest shadow-sm hover:bg-navy-bg-primary focus:outline-none focus:ring-2 focus:ring-navy-accent focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

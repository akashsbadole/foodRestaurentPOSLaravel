export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center px-4 py-2 bg-navy-primary border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-navy-primary-light focus:bg-navy-primary-light active:bg-navy-primary focus:outline-none focus:ring-2 focus:ring-navy-accent focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm hover:shadow-md ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

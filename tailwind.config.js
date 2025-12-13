import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        screens: {
            // Custom breakpoints for restaurant devices
            'xs': '320px',    // Small smartphones
            'sm': '480px',    // Large smartphones
            'md': '768px',    // Small tablets (iPad Mini)
            'lg': '1024px',   // Large tablets (iPad Pro, Android tablets)
            'xl': '1280px',   // Small desktops
            '2xl': '1536px',  // Desktops and larger displays
            
            // Restaurant-specific breakpoints
            'tablet-sm': '600px',   // Small tablets in portrait
            'tablet-lg': '900px',   // Large tablets in portrait
            'tablet-h': '1200px',   // Tablets in landscape
            'mobile-h': '480px',    // Mobile in landscape
        },
        extend: {
            fontFamily: {
                sans: [
                    'Figtree',
                    ...defaultTheme.fontFamily.sans
                ]
            },
            colors: {
                // Navy Blue Color Palette
                'navy': {
                    // Primary Navy Colors
                    'primary': '#1e3a5f',      // Deep navy blue
                    'primary-light': '#2c5282', // Lighter navy for hover states
                    'accent': '#3182ce',       // Brighter blue for actions
                    
                    // Background and Surface Colors
                    'bg-primary': '#f8fafc',   // Light grayish blue background
                    'surface': '#ffffff',      // Clean white for cards
                    
                    // Text Colors
                    'text-primary': '#1a202c', // Dark blue-gray
                    'text-secondary': '#4a5568', // Medium blue-gray
                    
                    // Restaurant Status Colors
                    // Table Statuses
                    'table-available': '#10b981',    // Green
                    'table-occupied': '#ef4444',     // Red
                    'table-reserved': '#f59e0b',     // Amber
                    'table-cleaning': '#6b7280',    // Gray
                    
                    // Order Statuses
                    'order-pending': '#f59e0b',      // Amber
                    'order-preparing': '#3b82f6',    // Blue
                    'order-ready': '#10b981',        // Green
                    'order-served': '#6b7280',       // Gray
                    
                    // Kitchen Queue Statuses
                    'kitchen-new': '#f59e0b',        // Amber
                    'kitchen-in-progress': '#3b82f6', // Blue
                    'kitchen-completed': '#10b981',   // Green
                    'kitchen-cancelled': '#ef4444',   // Red
                }
            },
            // Touch-friendly spacing and sizing
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '112': '28rem',
                '128': '32rem',
            },
            // Touch-friendly font sizes
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '1' }],
            },
            // Touch-friendly min-height for buttons
            minHeight: {
                '12': '3rem',
                '14': '3.5rem',
                '16': '4rem',
                '20': '5rem',
            },
            // Touch-friendly animations
            animation: {
                'bounce-subtle': 'bounce 1s infinite 0.5s',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                }
            },
            // Touch-friendly shadows
            boxShadow: {
                'touch': '0 4px 14px 0 rgba(30, 58, 95, 0.15)',
                'touch-lg': '0 10px 25px -5px rgba(30, 58, 95, 0.2)',
                'touch-xl': '0 20px 40px -10px rgba(30, 58, 95, 0.25)',
            }
        },
    },

    plugins: [forms, require("tailwindcss-animate")],
};
import React, { createContext, useContext, useEffect, useState } from 'react';

const BrandThemeContext = createContext();

export const useBrandTheme = () => {
    const context = useContext(BrandThemeContext);
    if (!context) {
        throw new Error('useBrandTheme must be used within a BrandThemeProvider');
    }
    return context;
};

export const BrandThemeProvider = ({ children, brandSettings }) => {
    const [theme, setTheme] = useState({
        colors: {},
        typography: {},
        spacing: {},
        borderRadius: {},
        customCSS: '',
    });

    useEffect(() => {
        if (brandSettings) {
            const newTheme = {
                colors: {
                    primary: brandSettings.primary_color || '#3B82F6',
                    secondary: brandSettings.secondary_color || '#64748B',
                    accent: brandSettings.accent_color || '#EF4444',
                    success: brandSettings.success_color || '#10B981',
                    warning: brandSettings.warning_color || '#F59E0B',
                    error: brandSettings.error_color || '#EF4444',
                    info: brandSettings.info_color || '#3B82F6',
                    gradientStart: brandSettings.gradient_start,
                    gradientEnd: brandSettings.gradient_end,
                    gradientDirection: brandSettings.gradient_direction || 'to right',
                },
                typography: {
                    fontFamily: brandSettings.font_family || 'Inter',
                    fontSize: brandSettings.font_size || 'medium',
                },
                spacing: {},
                borderRadius: {
                    value: brandSettings.border_radius || 'medium',
                    css: getBorderRadiusCSS(brandSettings.border_radius || 'medium'),
                },
                customCSS: brandSettings.custom_css || '',
                themeMode: brandSettings.theme_mode || 'light',
                sidebarStyle: brandSettings.sidebar_style || 'default',
            };

            setTheme(newTheme);
            applyThemeToDOM(newTheme);
        }
    }, [brandSettings]);

    const getBorderRadiusCSS = (radius) => {
        const radii = {
            'none': '0',
            'small': '0.25rem',
            'medium': '0.5rem',
            'large': '1rem',
            'full': '9999px'
        };
        return radii[radius] || radii['medium'];
    };

    const getFontSizeCSS = (size) => {
        const sizes = {
            'small': '14px',
            'medium': '16px',
            'large': '18px'
        };
        return sizes[size] || sizes['medium'];
    };

    const applyThemeToDOM = (themeData) => {
        const root = document.documentElement;
        
        // Apply CSS variables
        root.style.setProperty('--brand-primary', themeData.colors.primary);
        root.style.setProperty('--brand-secondary', themeData.colors.secondary);
        root.style.setProperty('--brand-accent', themeData.colors.accent);
        root.style.setProperty('--brand-success', themeData.colors.success);
        root.style.setProperty('--brand-warning', themeData.colors.warning);
        root.style.setProperty('--brand-error', themeData.colors.error);
        root.style.setProperty('--brand-info', themeData.colors.info);
        root.style.setProperty('--brand-font-family', themeData.typography.fontFamily);
        root.style.setProperty('--brand-font-size', getFontSizeCSS(themeData.typography.fontSize));
        root.style.setProperty('--brand-border-radius', themeData.borderRadius.css);
        
        if (themeData.colors.gradientStart && themeData.colors.gradientEnd) {
            root.style.setProperty('--brand-gradient', 
                `linear-gradient(${themeData.colors.gradientDirection}, ${themeData.colors.gradientStart}, ${themeData.colors.gradientEnd})`
            );
        }

        // Apply theme mode class
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeData.themeMode}`);

        // Apply custom CSS
        let customStyleElement = document.getElementById('brand-custom-styles');
        if (!customStyleElement) {
            customStyleElement = document.createElement('style');
            customStyleElement.id = 'brand-custom-styles';
            document.head.appendChild(customStyleElement);
        }
        
        let customCSS = themeData.customCSS || '';
        
        // Add base theme styles
        customCSS += `
            :root {
                --brand-primary: ${themeData.colors.primary};
                --brand-secondary: ${themeData.colors.secondary};
                --brand-accent: ${themeData.colors.accent};
                --brand-success: ${themeData.colors.success};
                --brand-warning: ${themeData.colors.warning};
                --brand-error: ${themeData.colors.error};
                --brand-info: ${themeData.colors.info};
                --brand-font-family: ${themeData.typography.fontFamily};
                --brand-font-size: ${getFontSizeCSS(themeData.typography.fontSize)};
                --brand-border-radius: ${themeData.borderRadius.css};
                ${themeData.colors.gradientStart && themeData.colors.gradientEnd ? 
                    `--brand-gradient: linear-gradient(${themeData.colors.gradientDirection}, ${themeData.colors.gradientStart}, ${themeData.colors.gradientEnd});` : 
                    ''}
            }
            
            body {
                font-family: var(--brand-font-family), system-ui, -apple-system, sans-serif;
                font-size: var(--brand-font-size);
            }
            
            .theme-dark {
                --bg-primary: #1f2937;
                --bg-secondary: #374151;
                --text-primary: #f9fafb;
                --text-secondary: #d1d5db;
                --border-color: #4b5563;
            }
            
            .theme-light {
                --bg-primary: #ffffff;
                --bg-secondary: #f9fafb;
                --text-primary: #111827;
                --text-secondary: #6b7280;
                --border-color: #e5e7eb;
            }
            
            .brand-primary-bg {
                background-color: var(--brand-primary) !important;
            }
            
            .brand-primary-text {
                color: var(--brand-primary) !important;
            }
            
            .brand-secondary-bg {
                background-color: var(--brand-secondary) !important;
            }
            
            .brand-secondary-text {
                color: var(--brand-secondary) !important;
            }
            
            .brand-accent-bg {
                background-color: var(--brand-accent) !important;
            }
            
            .brand-accent-text {
                color: var(--brand-accent) !important;
            }
            
            .brand-gradient-bg {
                background: var(--brand-gradient) !important;
            }
            
            .brand-rounded {
                border-radius: var(--brand-border-radius) !important;
            }
            
            .btn-brand {
                background-color: var(--brand-primary);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: var(--brand-border-radius);
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn-brand:hover {
                filter: brightness(1.1);
                transform: translateY(-1px);
            }
            
            .btn-brand-outline {
                background-color: transparent;
                color: var(--brand-primary);
                border: 2px solid var(--brand-primary);
                padding: 0.5rem 1rem;
                border-radius: var(--brand-border-radius);
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn-brand-outline:hover {
                background-color: var(--brand-primary);
                color: white;
            }
            
            .card-brand {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            
            .sidebar-brand {
                background-color: var(--bg-primary);
                border-right: 1px solid var(--border-color);
            }
            
            .sidebar-brand.condensed {
                width: 4rem;
            }
            
            .sidebar-brand.expanded {
                width: 16rem;
            }
        `;
        
        customStyleElement.textContent = customCSS;

        // Update favicon if provided
        if (brandSettings?.favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = brandSettings.favicon_url;
        }

        // Update page title
        if (brandSettings?.app_name) {
            document.title = brandSettings.app_name;
        }
    };

    const updateTheme = (newSettings) => {
        const updatedTheme = {
            ...theme,
            ...newSettings,
        };
        setTheme(updatedTheme);
        applyThemeToDOM(updatedTheme);
    };

    const value = {
        theme,
        updateTheme,
        brandSettings,
    };

    return (
        <BrandThemeContext.Provider value={value}>
            {children}
        </BrandThemeContext.Provider>
    );
};

export default BrandThemeProvider;
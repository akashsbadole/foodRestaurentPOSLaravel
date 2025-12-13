export const industryTemplates = {
    restaurant: {
        fine_dining: {
            name: 'Fine Dining',
            description: 'Elegant and sophisticated theme for upscale restaurants',
            primary_color: '#1F2937',
            secondary_color: '#F3F4F6',
            accent_color: '#DC2626',
            success_color: '#059669',
            warning_color: '#D97706',
            error_color: '#DC2626',
            info_color: '#1E40AF',
            font_family: 'Playfair Display',
            font_size: 'medium',
            border_radius: 'small',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Table',
                    order: 'Order',
                    bill: 'Check',
                    waiter: 'Server',
                    customer: 'Guest',
                    menu: 'Menu',
                    reservation: 'Reservation'
                },
                features: {
                    enable_reservations: true,
                    enable_waitlist: true,
                    enable_table_management: true,
                    enable_kitchen_display: true,
                    enable_split_bills: true,
                    enable_tips: true
                },
                ui_elements: {
                    show_table_numbers: true,
                    show_waiter_names: true,
                    show_order_time: true,
                    show_preparation_time: true,
                    enable_table_colors: true
                }
            }
        },
        fast_food: {
            name: 'Fast Food',
            description: 'Bright and energetic theme for quick service restaurants',
            primary_color: '#DC2626',
            secondary_color: '#FEF3C7',
            accent_color: '#F59E0B',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Poppins',
            font_size: 'medium',
            border_radius: 'medium',
            theme_mode: 'light',
            sidebar_style: 'condensed',
            industry_config: {
                terminology: {
                    table: 'Table',
                    order: 'Order',
                    bill: 'Receipt',
                    waiter: 'Cashier',
                    customer: 'Customer',
                    menu: 'Menu',
                    reservation: 'Order'
                },
                features: {
                    enable_reservations: false,
                    enable_waitlist: false,
                    enable_table_management: false,
                    enable_kitchen_display: true,
                    enable_split_bills: false,
                    enable_tips: false
                },
                ui_elements: {
                    show_table_numbers: false,
                    show_waiter_names: false,
                    show_order_time: true,
                    show_preparation_time: true,
                    enable_table_colors: false,
                    show_order_queue: true
                }
            }
        },
        cafe: {
            name: 'Cafe',
            description: 'Warm and cozy theme for coffee shops and cafes',
            primary_color: '#92400E',
            secondary_color: '#FEF3C7',
            accent_color: '#059669',
            success_color: '#059669',
            warning_color: '#D97706',
            error_color: '#DC2626',
            info_color: '#1E40AF',
            font_family: 'Merriweather',
            font_size: 'medium',
            border_radius: 'large',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Table',
                    order: 'Order',
                    bill: 'Bill',
                    waiter: 'Barista',
                    customer: 'Customer',
                    menu: 'Menu',
                    reservation: 'Reservation'
                },
                features: {
                    enable_reservations: true,
                    enable_waitlist: true,
                    enable_table_management: true,
                    enable_kitchen_display: false,
                    enable_split_bills: true,
                    enable_tips: true
                },
                ui_elements: {
                    show_table_numbers: true,
                    show_waiter_names: true,
                    show_order_time: true,
                    show_preparation_time: false,
                    enable_table_colors: true,
                    show_loyalty_points: true
                }
            }
        },
        bar: {
            name: 'Bar',
            description: 'Dark and modern theme for bars and lounges',
            primary_color: '#1F2937',
            secondary_color: '#374151',
            accent_color: '#8B5CF6',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Oswald',
            font_size: 'medium',
            border_radius: 'medium',
            theme_mode: 'dark',
            sidebar_style: 'expanded',
            industry_config: {
                terminology: {
                    table: 'Table',
                    order: 'Order',
                    bill: 'Tab',
                    waiter: 'Bartender',
                    customer: 'Guest',
                    menu: 'Menu',
                    reservation: 'Reservation'
                },
                features: {
                    enable_reservations: true,
                    enable_waitlist: true,
                    enable_table_management: true,
                    enable_kitchen_display: true,
                    enable_split_bills: true,
                    enable_tips: true,
                    enable_tab_management: true
                },
                ui_elements: {
                    show_table_numbers: true,
                    show_waiter_names: true,
                    show_order_time: true,
                    show_preparation_time: true,
                    enable_table_colors: true,
                    show_drink_categories: true,
                    show_alcohol_content: true
                }
            }
        },
        modern: {
            name: 'Modern',
            description: 'Clean and contemporary design for modern restaurants',
            primary_color: '#3B82F6',
            secondary_color: '#F3F4F6',
            accent_color: '#10B981',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Inter',
            font_size: 'medium',
            border_radius: 'medium',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Table',
                    order: 'Order',
                    bill: 'Bill',
                    waiter: 'Server',
                    customer: 'Customer',
                    menu: 'Menu',
                    reservation: 'Reservation'
                },
                features: {
                    enable_reservations: true,
                    enable_waitlist: true,
                    enable_table_management: true,
                    enable_kitchen_display: true,
                    enable_split_bills: true,
                    enable_tips: true
                },
                ui_elements: {
                    show_table_numbers: true,
                    show_waiter_names: true,
                    show_order_time: true,
                    show_preparation_time: true,
                    enable_table_colors: true,
                    show_order_status: true
                }
            }
        }
    },
    retail: {
        boutique: {
            name: 'Boutique',
            description: 'Elegant theme for boutique retail stores',
            primary_color: '#7C3AED',
            secondary_color: '#F3E8FF',
            accent_color: '#EC4899',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Montserrat',
            font_size: 'medium',
            border_radius: 'large',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Section',
                    order: 'Sale',
                    bill: 'Receipt',
                    waiter: 'Associate',
                    customer: 'Customer',
                    menu: 'Products',
                    reservation: 'Appointment'
                },
                features: {
                    enable_inventory: true,
                    enable_customer_loyalty: true,
                    enable_gift_cards: true,
                    enable_returns: true,
                    enable_special_orders: true
                }
            }
        },
        supermarket: {
            name: 'Supermarket',
            description: 'Functional theme for grocery stores and supermarkets',
            primary_color: '#059669',
            secondary_color: '#ECFDF5',
            accent_color: '#F59E0B',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Roboto',
            font_size: 'medium',
            border_radius: 'small',
            theme_mode: 'light',
            sidebar_style: 'condensed',
            industry_config: {
                terminology: {
                    table: 'Aisle',
                    order: 'Sale',
                    bill: 'Receipt',
                    waiter: 'Cashier',
                    customer: 'Customer',
                    menu: 'Products',
                    reservation: 'Order'
                },
                features: {
                    enable_inventory: true,
                    enable_barcode_scanning: true,
                    enable_weighing_scale: true,
                    enable_price_lookup: true,
                    enable_bulk_pricing: true
                }
            }
        }
    },
    service: {
        salon: {
            name: 'Salon',
            description: 'Professional theme for beauty salons and spas',
            primary_color: '#EC4899',
            secondary_color: '#FCE7F3',
            accent_color: '#8B5CF6',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Lato',
            font_size: 'medium',
            border_radius: 'large',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Station',
                    order: 'Service',
                    bill: 'Invoice',
                    waiter: 'Stylist',
                    customer: 'Client',
                    menu: 'Services',
                    reservation: 'Appointment'
                },
                features: {
                    enable_appointments: true,
                    enable_client_history: true,
                    enable_service_packages: true,
                    enable_gift_cards: true,
                    enable_tips: true
                }
            }
        },
        automotive: {
            name: 'Automotive',
            description: 'Professional theme for auto repair shops',
            primary_color: '#1F2937',
            secondary_color: '#F3F4F6',
            accent_color: '#DC2626',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Oswald',
            font_size: 'medium',
            border_radius: 'small',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Bay',
                    order: 'Service',
                    bill: 'Invoice',
                    waiter: 'Technician',
                    customer: 'Customer',
                    menu: 'Services',
                    reservation: 'Appointment'
                },
                features: {
                    enable_appointments: true,
                    enable_vehicle_history: true,
                    enable_parts_inventory: true,
                    enable_service_reminders: true,
                    enable_labor_tracking: true
                }
            }
        }
    },
    healthcare: {
        clinic: {
            name: 'Clinic',
            description: 'Clean and professional theme for medical clinics',
            primary_color: '#0891B2',
            secondary_color: '#ECFEFF',
            accent_color: '#0E7490',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Open Sans',
            font_size: 'medium',
            border_radius: 'medium',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Room',
                    order: 'Visit',
                    bill: 'Invoice',
                    waiter: 'Doctor',
                    customer: 'Patient',
                    menu: 'Services',
                    reservation: 'Appointment'
                },
                features: {
                    enable_appointments: true,
                    enable_patient_records: true,
                    enable_billing: true,
                    enable_insurance: true,
                    enable_prescriptions: true
                }
            }
        },
        pharmacy: {
            name: 'Pharmacy',
            description: 'Professional theme for pharmacies',
            primary_color: '#059669',
            secondary_color: '#ECFDF5',
            accent_color: '#047857',
            success_color: '#10B981',
            warning_color: '#F59E0B',
            error_color: '#EF4444',
            info_color: '#3B82F6',
            font_family: 'Roboto',
            font_size: 'medium',
            border_radius: 'medium',
            theme_mode: 'light',
            sidebar_style: 'default',
            industry_config: {
                terminology: {
                    table: 'Section',
                    order: 'Prescription',
                    bill: 'Receipt',
                    waiter: 'Pharmacist',
                    customer: 'Patient',
                    menu: 'Medications',
                    reservation: 'Refill'
                },
                features: {
                    enable_prescriptions: true,
                    enable_inventory: true,
                    enable_patient_records: true,
                    enable_insurance: true,
                    enable_refill_reminders: true
                }
            }
        }
    }
};

export const getIndustryTemplates = (industryType) => {
    return industryTemplates[industryType] || {};
};

export const getTemplate = (industryType, templateKey) => {
    return industryTemplates[industryType]?.[templateKey] || null;
};

export const getAllIndustries = () => {
    return Object.keys(industryTemplates);
};

export const getTemplateOptions = (industryType) => {
    const templates = getIndustryTemplates(industryType);
    return Object.entries(templates).map(([key, template]) => ({
        key,
        name: template.name,
        description: template.description,
        ...template
    }));
};

export default industryTemplates;
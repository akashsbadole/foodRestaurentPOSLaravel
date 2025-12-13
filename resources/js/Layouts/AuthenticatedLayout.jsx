import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { MenuItem } from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { useThemeContext } from "../Components/ThemeProvider";
import { BrandThemeProvider } from "../Components/Brand/BrandThemeProvider";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import Tooltip from "@mui/material/Tooltip";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Fab from "@mui/material/Fab";
import HomeIcon from "@mui/icons-material/Home";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { styled } from "@mui/material/styles";

// Restaurant Icons
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import KitchenIcon from '@mui/icons-material/Kitchen';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FastfoodIcon from '@mui/icons-material/Fastfood';

// Payroll Icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import infoshopLogo from "@/foodflow.png";
const drawerWidth = 280; // Increased width for better restaurant navigation

const StyledDrawer = styled(Drawer)(({ theme, isMobile }) => ({
    '& .MuiDrawer-paper': {
        boxSizing: 'border-box',
        width: isMobile ? drawerWidth : 260,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
        backgroundColor: theme.palette.background.paper,
        overflowX: 'hidden',
        overflowY: 'auto',
        touchAction: 'pan-y', // Improve touch performance
        scrollbarWidth: 'thin', // Thinner scrollbar for mobile
        scrollbarColor: theme.palette.mode === 'dark'
            ? '#334155 #1e293b'
            : '#e2e8f0 #f1f5f9',
    },
}));

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    '& .MuiBottomNavigationAction-root': {
        minWidth: 0,
        paddingTop: 8,
        paddingBottom: 8,
        '& .MuiSvgIcon-root': {
            fontSize: '1.5rem',
            color: theme.palette.text.secondary,
        },
        '&.Mui-selected': {
            color: theme.palette.primary.main,
            '& .MuiSvgIcon-root': {
                color: theme.palette.primary.main,
            },
        },
    },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: 80,
    right: 16,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)',
    width: 56,
    height: 56,
    zIndex: 1000,
    '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: '0 6px 16px rgba(30, 58, 95, 0.4)',
    },
}));

const StyledSpeedDial = styled(SpeedDial)(({ theme, isMobile }) => ({
    position: 'fixed',
    bottom: isMobile ? 80 : 24,
    right: isMobile ? 80 : 24,
    '& .MuiSpeedDial-fab': {
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)',
        width: isMobile ? 56 : 48,
        height: isMobile ? 56 : 48,
    },
    '& .MuiSpeedDialAction-root': {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.primary.main,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}));

function AuthenticatedLayout({ header, children, ...props }) {
    const user = usePage().props.auth.user;
    const shop_name = usePage().props.settings.shop_name;
    const brand = usePage().props.brand;
    const modules = usePage().props.modules;
    const pageLabel = usePage().props.pageLabel;
    const pathname = usePage().url;
    const permissions = usePage().props.userPermissions;
    const { theme, updateBrandColors } = useThemeContext();
    // Using Tailwind breakpoint values instead of Material-UI
    const isMobile = useMediaQuery('(max-width: 767px)'); // Tailwind 'md' breakpoint
    const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)'); // Tailwind 'md' to 'lg' breakpoint

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [open, setOpen] = useState(true); // Drawer open state for desktop
    const [collapse, setCollapse] = useState(false);
    const [restaurantCollapse, setRestaurantCollapse] = useState(false);
    const [reportsCollapse, setReportsCollapse] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);

    useEffect(() => {
        const childDiv = document.querySelector(".scrollParent");
        if (childDiv) {
            childDiv.setAttribute("data-custom-attribute", "value");
        }
    }, []);

    // Update brand colors when brand settings change
    useEffect(() => {
        console.log('AuthenticatedLayout: Brand changed', brand);
        if (brand) {
            updateBrandColors(brand);
        }
    }, [brand]); // Remove updateBrandColors from dependencies to prevent infinite loop

    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };

    const handleCollapse = () => {
        setCollapse(!collapse);
    };

    const handleRestaurantCollapse = () => {
        setRestaurantCollapse(!restaurantCollapse);
    };

    const handleReportsCollapse = () => {
        setReportsCollapse(!reportsCollapse);
    };

    // Logic to selected menu item
    const isSelected = (href) => {
        const baseHref = href.split("?")[0]; // Extract the base path by removing query parameters
        return pathname === baseHref || pathname.startsWith(baseHref);
    };

    // Helper function to check if user has any restaurant permissions
    const hasRestaurantPermissions = () => {
        return permissions.includes('restaurant_tables') ||
            permissions.includes('restaurant_orders') ||
            permissions.includes('restaurant_kitchen') ||
            permissions.includes('restaurant_reservations');
    };

    // Helper function to check if user has report permissions
    const hasReportPermissions = () => {
        return permissions.includes('reports_sales') ||
            permissions.includes('reports_summary');
    };

    // Helper function to check if user has payroll permissions
    const hasPayrollPermissions = () => {
        return permissions.includes('employees') ||
            permissions.includes('payroll_management');
    };

    const NavItem = ({ href, icon: Icon, label, open, selected, onClick, badgeContent }) => (
        <Link preserveScroll href={href}>
            <ListItem disablePadding sx={{ display: "block", mb: 0.5 }}>
                <ListItemButton
                    selected={selected}
                    sx={[
                        {
                            minHeight: isMobile ? 48 : 56, // Touch-friendly height
                            px: 2.5,
                            borderRadius: 2,
                            mx: 1,
                            mb: 0.5,
                            "&.Mui-selected": {
                                color: "white",
                                backgroundColor: theme.palette.primary.main,
                                "& .MuiListItemIcon-root": {
                                    color: "white",
                                },
                                "&:hover": {
                                    backgroundColor: theme.palette.primary.light,
                                },
                            },
                            "&:hover": {
                                color: "white",
                                backgroundColor: theme.palette.primary.light,
                                "& .MuiListItemIcon-root": {
                                    color: "white",
                                },
                            },
                            transition: 'all 0.2s ease-in-out',
                        },
                        open
                            ? { justifyContent: "initial" }
                            : { justifyContent: "center" },
                    ]}
                    onClick={onClick}
                >
                    <ListItemIcon
                        sx={[
                            {
                                minWidth: 0,
                                justifyContent: "center",
                                color: selected ? "white" : theme.palette.primary.main,
                            },
                            open ? { mr: 3 } : { mr: "auto" },
                        ]}
                    >
                        {Icon && <Icon />}
                    </ListItemIcon>
                    <ListItemText
                        primary={label}
                        sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                        primaryTypographyProps={{
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            fontWeight: 500,
                        }}
                    />
                    {badgeContent && (
                        <Box
                            component="span"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: theme.palette.error.main,
                                color: 'white',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                            }}
                        >
                            {badgeContent}
                        </Box>
                    )}
                </ListItemButton>
            </ListItem>
        </Link>
    );

    const drawer = (
        <>
            <Toolbar sx={{
                display: "flex",
                justifyContent: "center",
                backgroundColor: theme.palette.primary.main,
                color: "white",
                py: 2
            }}>
                <img
                    src={brand?.logo_url || infoshopLogo}
                    style={{ objectFit: "contain", height: "40px" }}
                    alt={brand?.app_name || "Logo"}
                />
            </Toolbar>
            <Divider sx={{ borderColor: theme.palette.primary.light }} />

            {/* Quick Access Section for Restaurant Operations */}
            <Box sx={{ px: 2, py: 1 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: 0.5
                    }}
                >
                    Quick Access
                </Typography>
            </Box>

            <List sx={{ pt: 0 }}>
                {/* Restaurant POS - Always visible for restaurant users */}
                {permissions.includes("pos") && (
                    <NavItem
                        href="/restaurant-pos"
                        icon={PointOfSaleIcon}
                        label="Restaurant POS"
                        open={open}
                        selected={isSelected("/restaurant-pos")}
                    />
                )}

                {/* Restaurant Dashboard */}
                <NavItem
                    href="/dashboard"
                    icon={DashboardIcon}
                    label="Restaurant Dashboard"
                    open={open}
                    selected={isSelected("/dashboard")}
                />
            </List>

            {/* Restaurant Management Section */}
            {hasRestaurantPermissions() && (
                <>
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                letterSpacing: 0.5
                            }}
                        >
                            Restaurant Operations
                        </Typography>
                    </Box>
                    <List sx={{ pt: 0 }}>
                        {permissions.includes('restaurant_tables') && (
                            <NavItem
                                href="/restaurant/tables"
                                icon={TableRestaurantIcon}
                                label="Table Management"
                                open={open}
                                selected={isSelected("/restaurant/tables")}
                            />
                        )}
                        {permissions.includes('restaurant_orders') && (
                            <NavItem
                                href="/restaurant/orders"
                                icon={ReceiptLongIcon}
                                label="Order Management"
                                open={open}
                                selected={isSelected("/restaurant/orders")}
                            />
                        )}
                        {permissions.includes('restaurant_kitchen') && (
                            <NavItem
                                href="/restaurant/kitchen/dashboard"
                                icon={KitchenIcon}
                                label="Kitchen Display"
                                open={open}
                                selected={isSelected("/restaurant/kitchen")}
                            />
                        )}
                        {permissions.includes('restaurant_reservations') && (
                            <NavItem
                                href="/restaurant/reservations"
                                icon={EventSeatIcon}
                                label="Reservations"
                                open={open}
                                selected={isSelected("/restaurant/reservations")}
                            />
                        )}
                    </List>
                </>
            )}

            {/* Restaurant Reports Section */}
            {hasReportPermissions() && (
                <>
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                letterSpacing: 0.5
                            }}
                        >
                            Restaurant Reports
                        </Typography>
                    </Box>
                    <List sx={{ pt: 0 }}>
                        {permissions.includes('reports_sales') && (
                            <NavItem
                                href="/reports/sales"
                                icon={AssessmentIcon}
                                label="Restaurant Reports"
                                open={open}
                                selected={isSelected("/reports/sales")}
                            />
                        )}
                        {permissions.includes('reports_summary') && (
                            <NavItem
                                href="/reports/summary-report"
                                icon={BarChartIcon}
                                label="Summary Reports"
                                open={open}
                                selected={isSelected("/reports/summary-report")}
                            />
                        )}
                    </List>
                </>
            )}

            {/* Payroll Management Section */}
            {hasPayrollPermissions() && (
                <>
                    <Box sx={{ px: 2, py: 1, mt: 2 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: theme.palette.success.main,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                letterSpacing: 0.5
                            }}
                        >
                            Payroll Management
                        </Typography>
                    </Box>
                    <List sx={{ pt: 0 }}>
                        <NavItem
                            href="/payroll"
                            icon={AccountBalanceWalletIcon}
                            label="Payroll Dashboard"
                            open={open}
                            selected={isSelected("/payroll")}
                        />
                        <NavItem
                            href="/payroll/process-payment"
                            icon={PaymentIcon}
                            label="Process Payments"
                            open={open}
                            selected={isSelected("/payroll/process-payment")}
                        />
                        <NavItem
                            href="/employees"
                            icon={PeopleAltIcon}
                            label="Employees"
                            open={open}
                            selected={isSelected("/employees")}
                        />
                        <NavItem
                            href="/employee-balance-log"
                            icon={AttachMoneyIcon}
                            label="Balance & Payment Log"
                            open={open}
                            selected={isSelected("/employee-balance-log")}
                        />
                    </List>
                </>
            )}

            {/* Settings Section */}
            <Box sx={{ px: 2, py: 1, mt: 2 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: theme.palette.mode === 'dark' ? '#90caf9' : '#1e3a5f',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: 0.5
                    }}
                >
                    Administration
                </Typography>
            </Box>
            <List sx={{ pt: 0 }}>
                {permissions.includes("settings") && (
                    <NavItem
                        href="/settings"
                        icon={SettingsIcon}
                        label="Settings"
                        open={open}
                        selected={isSelected("/settings")}
                    />
                )}
                {user.user_role == "admin" && (
                    <NavItem
                        href="/brands"
                        icon={ManageAccountsIcon}
                        label="Brand Management"
                        open={open}
                        selected={isSelected("/brands")}
                    />
                )}
                <NavItem
                    href="/profile"
                    icon={ManageAccountsIcon}
                    label="Profile"
                    open={open}
                    selected={isSelected("/profile")}
                />
                {user.user_role == "admin" && (
                    <>
                        <ListItemButton onClick={handleCollapse} sx={{ mx: 1, borderRadius: 2 }}>
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="User Management" />
                            {collapse ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={collapse} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <NavItem
                                    href="/users"
                                    icon={null}
                                    label="All Users"
                                    open={open}
                                    selected={isSelected("/users")}
                                />
                                <NavItem
                                    href="/user/role"
                                    icon={null}
                                    label="User Roles"
                                    open={open}
                                    selected={isSelected("/user/role")}
                                />
                            </List>
                        </Collapse>
                    </>
                )}

                <NavItem
                    href={"#"}
                    icon={LogoutIcon}
                    label="Logout"
                    open={open}
                    onClick={(e) => {
                        e.preventDefault();
                        router.post(document.location.origin + "/logout");
                    }}
                />
            </List>
        </>
    );

    return (
        <BrandThemeProvider brandSettings={brand}>
            <Box sx={{ display: "flex" }}>
                <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderBottom: `1px solid ${theme.palette.primary.light}`,
                    height: { xs: 56, sm: 64 }, // Responsive height using Tailwind breakpoints
                }}
            >
                <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
                    <Grid
                        container
                        spacing={2}
                        alignItems={{ sm: "center", xs: "start" }}
                        justifyContent={"space-between"}
                        width={"100%"}
                        display={"flex"}
                        flexDirection={{ xs: "column", sm: "row" }}
                    >
                        <Typography
                            variant="h5"
                            noWrap
                            component="div"
                            sx={{
                                textTransform: "capitalize",
                                fontSize: { xs: "1rem", sm: "1.5rem" },
                                fontWeight: 600,
                                color: "white",
                            }}
                        >
                            {brand?.app_name || shop_name} | {pageLabel}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {/* Quick Action Buttons for Restaurant Workflow */}
                            {hasRestaurantPermissions() && (
                                <>
                                    <Tooltip title="Quick Table Status" arrow>
                                        <IconButton
                                            color="inherit"
                                            size={isMobile ? 'small' : 'medium'}
                                            onClick={() => router.visit('/restaurant/tables')}
                                            sx={{
                                                display: { xs: "none", md: "flex" }, // Using Tailwind breakpoint equivalents
                                                '&:hover': {
                                                    backgroundColor: theme.palette.primary.light,
                                                }
                                            }}
                                        >
                                            <TableRestaurantIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Kitchen Display" arrow>
                                        <IconButton
                                            color="inherit"
                                            size={isMobile ? 'small' : 'medium'}
                                            onClick={() => router.visit('/restaurant/kitchen/dashboard')}
                                            sx={{
                                                display: { xs: "none", md: "flex" },
                                                '&:hover': {
                                                    backgroundColor: theme.palette.primary.light,
                                                }
                                            }}
                                        >
                                            <KitchenIcon />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                            <Tooltip title="Logout" arrow>
                                <IconButton
                                    color="inherit"
                                    size={isMobile ? 'small' : 'medium'}
                                    onClick={(e) =>
                                        router.post(
                                            document.location.origin + "/logout"
                                        )
                                    }
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: theme.palette.primary.light,
                                        }
                                    }}
                                >
                                    <LogoutIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{
                    width: { sm: drawerWidth },
                    flexShrink: { sm: 0 },
                    '& .MuiDrawer-paper': {
                        borderRight: `1px solid ${theme.palette.primary.light}`,
                    }
                }}
            >
                {/* Mobile Drawer */}
                <SwipeableDrawer
                    variant="temporary"
                    open={mobileOpen}
                    onTransitionEnd={handleDrawerTransitionEnd}
                    onClose={handleDrawerClose}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: "block", sm: "none" }, // Using Tailwind breakpoint equivalents
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                            borderRight: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
                            backgroundColor: theme.palette.background.paper,
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            touchAction: 'pan-y', // Improve touch performance
                            scrollbarWidth: 'thin', // Thinner scrollbar for mobile
                            scrollbarColor: theme.palette.mode === 'dark'
                                ? '#334155 #1e293b'
                                : '#e2e8f0 #f1f5f9',
                        },
                    }}
                >
                    {drawer}
                </SwipeableDrawer>

                {/* Desktop Drawer */}
                <StyledDrawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", sm: "block" },
                        "& .MuiDrawer-paper": {
                            borderRight: `1px solid ${theme.palette.primary.light}`,
                        },
                    }}
                    open
                    classes={{
                        paper: "scrollParent", // Adds class to the child div
                    }}
                >
                    {drawer}
                </StyledDrawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 2, md: 3 }, // Using Tailwind breakpoint equivalents
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    backgroundColor: theme.palette.background.default,
                    minHeight: '100vh',
                    // Add padding for mobile bottom navigation
                    pb: isMobile ? 8 : 0,
                }}
            >
                <Toolbar />
                {children}
            </Box>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <StyledBottomNavigation
                    showLabels
                    value={pathname}
                    onChange={(event, newValue) => {
                        router.visit(newValue);
                    }}
                >
                    <BottomNavigationAction
                        label="Dashboard"
                        value="/dashboard"
                        icon={<HomeIcon />}
                    />
                    {hasRestaurantPermissions() && (
                        <>
                            <BottomNavigationAction
                                label="Tables"
                                value="/restaurant/tables"
                                icon={<TableRestaurantIcon />}
                            />
                            <BottomNavigationAction
                                label="Orders"
                                value="/restaurant/orders"
                                icon={<ReceiptLongIcon />}
                            />
                            <BottomNavigationAction
                                label="Kitchen"
                                value="/restaurant/kitchen/dashboard"
                                icon={<KitchenIcon />}
                            />
                            <BottomNavigationAction
                                label="Reservations"
                                value="/restaurant/reservations"
                                icon={<EventSeatIcon />}
                            />
                        </>
                    )}
                    {hasPayrollPermissions() && (
                        <BottomNavigationAction
                            label="Payroll"
                            value="/payroll"
                            icon={<AccountBalanceWalletIcon />}
                        />
                    )}
                    <BottomNavigationAction
                        label="Settings"
                        value="/settings"
                        icon={<SettingsIcon />}
                    />
                </StyledBottomNavigation>
            )}

            {/* Floating Action Button for Desktop/Tablet */}
            {!isMobile && (
                <StyledSpeedDial
                    ariaLabel="Quick actions"
                    icon={<TouchAppIcon />}
                    direction={isTablet ? 'left' : 'up'}
                    open={quickActionsOpen}
                    onOpen={() => setQuickActionsOpen(true)}
                    onClose={() => setQuickActionsOpen(false)}
                >
                    <SpeedDialAction
                        icon={<TableRestaurantIcon />}
                        tooltipTitle="Table Management"
                        onClick={() => router.visit('/restaurant/tables')}
                    />
                    <SpeedDialAction
                        icon={<KitchenIcon />}
                        tooltipTitle="Kitchen Display"
                        onClick={() => router.visit('/restaurant/kitchen/dashboard')}
                    />
                    <SpeedDialAction
                        icon={<ReceiptLongIcon />}
                        tooltipTitle="Order Management"
                        onClick={() => router.visit('/restaurant/orders')}
                    />
                    <SpeedDialAction
                        icon={<EventSeatIcon />}
                        tooltipTitle="Reservations"
                        onClick={() => router.visit('/restaurant/reservations')}
                    />
                    <SpeedDialAction
                        icon={<AssessmentIcon />}
                        tooltipTitle="Reports"
                        onClick={() => router.visit('/reports/sales')}
                    />
                    {hasPayrollPermissions() && (
                        <SpeedDialAction
                            icon={<AccountBalanceWalletIcon />}
                            tooltipTitle="Payroll"
                            onClick={() => router.visit('/payroll')}
                        />
                    )}
                </StyledSpeedDial>
            )}
        </Box>
            </BrandThemeProvider>
    );
}

export default AuthenticatedLayout;
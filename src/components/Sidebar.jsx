
import { useState, useEffect } from "react";

import {
    LayoutDashboard,
    Star,
    Map,
    Settings,
    Menu,
    X,
    CloudSun,
} from "lucide-react";

function Sidebar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const [activeSection, setActiveSection] = useState(
        window.location.hash || "#dashboard"
    );

    const menuItems = [
        {
            name: "Dashboard",
            icon: LayoutDashboard,
            href: "#dashboard",
        },
        {
            name: "Favorites",
            icon: Star,
            href: "#favorites",
        },
        {
            name: "Weather Map",
            icon: Map,
            href: "#weather-map",
        },
        {
            name: "Settings",
            icon: Settings,
            href: "#settings",
        },
    ];

    // Update active menu item when the URL hash changes
    useEffect(() => {
        function handleHashChange() {
            setActiveSection(window.location.hash || "#dashboard");
            setMenuOpen(false);
        }

        window.addEventListener("hashchange", handleHashChange);

        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, []);

    // Close mobile menu using Escape key
    useEffect(() => {
        function handleEscape(e) {
            if (e.key === "Escape") {
                setMenuOpen(false);
            }
        }

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Navigate to selected section
    function handleNavigation(href) {
        const target = document.querySelector(href);

        if (!target) {
            setMenuOpen(false);
            console.warn(`Navigation target ${href} was not found.`);
            return;
        }

        setActiveSection(href);
        setMenuOpen(false);

        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        window.history.replaceState(null, "", href);
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                type="button"
                className="mobile-menu-button"
                onClick={() => setMenuOpen((previous) => !previous)}
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                aria-controls="weatherly-sidebar"
            >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {menuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                id="weatherly-sidebar"
                className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
            >

                {/* Logo */}
                <div className="sidebar-logo">
                    <CloudSun size={32} />
                    <h2>Weatherly</h2>

                    <button
                        type="button"
                        className="sidebar-close-button"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">

                    <p className="sidebar-label">MENU</p>

                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                type="button"
                                className={`sidebar-link ${
                                    activeSection === item.href ? "active" : ""
                                }`}
                                key={item.name}
                                onClick={() => handleNavigation(item.href)}
                                aria-current={
                                    activeSection === item.href ? "page" : undefined
                                }
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}

                </nav>

                {/* Sidebar Bottom */}
                <div className="sidebar-bottom">

                    <div className="sidebar-location-card">
                        <CloudSun size={25} />

                        <div>
                            <strong>Weatherly</strong>
                            <p>Your weather companion</p>
                        </div>
                    </div>

                </div>

            </aside>
        </>
    );
}

export default Sidebar;

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import UserAuthBar from "@/components/auth/UserAuthBar";

export default function LandingNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    const links = [
        { href: "#about", label: "About" },
        { href: "#menu", label: "Menu" },
        { href: "#gallery", label: "Gallery" },
        { href: "#location", label: "Location" },
        { href: "#testimonials", label: "Reviews" },
        { href: "/reservations", label: "Reservation" },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gray-900/80 backdrop-blur-md ${scrolled ? "py-4 shadow-md" : "py-2"
                }`}
        >
            <div className="max-w-[--breakpoint-2xl] mx-auto px-4 md:px-6 flex justify-between items-center">
                <Link href="/" className="text-white text-xl font-bold tracking-wider hover:opacity-90 transition-opacity">
                    MyResto
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex gap-6">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-white/90 hover:text-white text-sm font-medium transition-colors hover:underline underline-offset-4"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <UserAuthBar />
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden text-white p-1 rounded-md hover:bg-white/10 transition-colors focus:outline-none"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`md:hidden fixed inset-0 bg-black/95 z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex flex-col items-center gap-8 w-full">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-2xl text-white font-medium hover:text-gray-300 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}

                    <div className="mt-8 transform scale-125" onClick={() => setIsOpen(false)}>
                        {/* Wrapper to ensure click closes menu if UserAuthBar contains links */}
                        <div className="pointer-events-auto">
                            <UserAuthBar />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

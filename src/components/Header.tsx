"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-serif font-bold text-[--navy]">
              Dykstra Funeral Home
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-[--navy] transition-colors">
              Home
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-[--navy] transition-colors">
              Services
            </Link>
            <Link href="/obituaries" className="text-gray-700 hover:text-[--navy] transition-colors">
              Obituaries
            </Link>
            <Link href="/pre-planning" className="text-gray-700 hover:text-[--navy] transition-colors">
              Pre-Planning
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-[--navy] transition-colors">
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="bg-[--navy] text-white px-6 py-2 rounded-md hover:bg-[--charcoal] transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-[--navy] py-2">
                Home
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-[--navy] py-2">
                Services
              </Link>
              <Link href="/obituaries" className="text-gray-700 hover:text-[--navy] py-2">
                Obituaries
              </Link>
              <Link href="/pre-planning" className="text-gray-700 hover:text-[--navy] py-2">
                Pre-Planning
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-[--navy] py-2">
                About Us
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-[--navy] py-2">
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

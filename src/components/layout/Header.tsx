"use client";

import Link from 'next/link';
import Logo from '../ui/Logo';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-black shadow-sm text-white">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center z-10">
          <Logo width={60} height={60} className="mr-3" />
        </Link>

        {/* Mobile menu button */}
        <button 
          type="button"
          className="md:hidden z-10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {!mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Desktop menu */}
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-[#E94FFF] font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-[#E94FFF] font-medium">
                Collections
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[#E94FFF] font-medium">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#E94FFF] font-medium">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile menu */}
        <div className={`fixed inset-0 bg-black bg-opacity-90 z-30 transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col items-center justify-center h-full">
            <ul className="flex flex-col space-y-8 text-center">
              <li>
                <Link 
                  href="/" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/products" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
} 
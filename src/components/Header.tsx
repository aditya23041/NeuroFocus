"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { info, toast } = useToast();
  const { user, login, logout, upgradeToPremium } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set default dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Determine page title based on pathname
  const getPageTitle = () => {
    switch (pathname) {
      case "/monitor":
        return "Live Monitor";
      case "/setup":
        return "Session Setup";
      case "/":
      default:
        return "NeuroFocus AI";
    }
  };

  const getSearchPlaceholder = () => {
    switch (pathname) {
      case "/monitor":
        return "Search sessions...";
      case "/setup":
        return "Search parameters...";
      case "/":
      default:
        return "Search analytics...";
    }
  };

  const handleMockLogin = async () => {
    const email = window.prompt("Enter mock email address for demo sign-in:", "aditya@example.com");
    if (email && email.trim() !== "") {
      await login(email);
    }
  };

  return (
    <header className="bg-slate-glass fixed top-0 right-0 w-[calc(100%-16rem)] h-16 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-margin-desktop z-40">
      {/* Search Input on Left */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 focus-within:ring-1 focus-within:ring-secondary rounded-full bg-surface-container border border-white/5 transition-all">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            className="w-full bg-transparent border-none py-1.5 pl-10 pr-4 text-body-md font-body-md text-on-surface placeholder-on-surface-variant focus:ring-0 rounded-full"
            placeholder={getSearchPlaceholder()}
          />
        </div>
      </div>

      {/* Page Title in Center */}
      <div className="font-headline-lg font-bold text-primary dark:text-primary mx-auto text-lg md:block hidden">
        {getPageTitle()}
      </div>

      {/* Trailing Actions on Right */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="text-on-surface-variant hover:text-secondary transition-all w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/50"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Notifications */}
        <button
          className="text-on-surface-variant hover:text-secondary transition-all w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/50 relative"
          title="Notifications"
          onClick={() => info("Notification panel coming soon!")}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error"></span>
        </button>

        {/* Dynamic Authentication Actions */}
        {user ? (
          <div className="relative flex items-center gap-3 ml-2" ref={dropdownRef}>
            {/* Subscription Badge */}
            {user.subscription === "free" ? (
              <button
                onClick={upgradeToPremium}
                className="bg-tertiary-container hover:bg-tertiary text-on-tertiary-container hover:text-surface px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all active:scale-95 duration-150"
                title="Upgrade to Premium Plan"
              >
                Upgrade 👑
              </button>
            ) : (
              <span className="bg-secondary/20 border border-secondary/30 text-secondary px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">
                Premium Pro
              </span>
            )}

            {/* Avatar image button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-secondary transition-all active:scale-95 duration-150"
              title="User profile"
            >
              <img
                src={user.avatar}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Dropdown Card */}
            {showDropdown && (
              <div className="absolute right-0 top-10 w-48 bg-surface-container border border-white/10 rounded-xl p-3 shadow-lg flex flex-col gap-2 backdrop-blur-xl animate-slide-in">
                <div className="px-1 py-1.5 border-b border-white/5">
                  <p className="text-xs text-on-surface font-semibold truncate">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    info("Account settings page coming soon!");
                  }}
                  className="w-full text-left text-xs text-on-surface hover:text-secondary py-1.5 px-1 rounded hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full text-left text-xs text-error hover:bg-error-container/20 py-1.5 px-1 rounded transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleMockLogin}
            className="bg-primary-container text-on-primary-container hover:bg-primary-container/80 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 duration-150 shadow-sm ml-2"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}



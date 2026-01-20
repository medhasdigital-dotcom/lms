import React from "react";
import { assets } from "../../assets/assets";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";

const Navbar = () => {
  const { user } = useUser();

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={assets.logo} alt="logo" className="w-24 md:w-32" />
        </Link>

        <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl">
          <label htmlFor="edu-search" className="sr-only">
            Search
          </label>
          <div className="relative w-full">
            <input
              id="edu-search"
              type="search"
              placeholder="Search courses, students..."
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            aria-label="Notifications"
            className="p-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden md:block text-sm text-gray-500">
            Hi, {user ? user.fullName : "Developer"}
          </div>

          {user ? (
            <UserButton />
          ) : (
            <img
              src={assets.profile_img}
              alt="profile"
              className="w-9 h-9 rounded-full bg-gray-100"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Menu, X, GraduationCap, Settings } from "lucide-react";
import { AppContext } from "../../context/AppContext";

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const { isEducator } = useContext(AppContext);
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Build nav links dynamically based on user state
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/course-list" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    // Only show My Enrollment when logged in
    ...(user ? [{ name: "My Enrollment", path: "/my-enrollments" }] : []),
    // Show Manage Courses for educators (special styling)
    ...(isEducator ? [{ name: "Manage Courses", path: "/educator", isSpecial: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-cyan-100/70 backdrop-blur border-b border-gray-200">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        
        {/* LOGO */}
        <Link to="/">
          <img src={assets.logo} alt="Logo" className="w-28" />
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');

            // Special styling for Manage Courses
            if (link.isSpecial) {
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg'
                  }`}
                >
                  <Settings size={16} className={isActive ? '' : 'animate-spin-slow'} />
                  {link.name}
                </Link>
              );
            }

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative font-medium text-gray-700 transition
                  ${isActive ? "text-blue-600" : "hover:text-blue-600"}
                `}
              >
                {link.name}

                {/* underline */}
                <span
                  className={`absolute left-0 -bottom-1 h-[2px] bg-blue-600 transition-all duration-300
                    ${isActive ? "w-full" : "w-0 group-hover:w-full"}
                  `}
                />
              </Link>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {isEducator && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                  <GraduationCap size={14} />
                  Educator
                </div>
              )}
              <UserButton />
            </div>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
            >
              Create Account
            </button>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-4">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');

            // Special styling for Manage Courses in mobile
            if (link.isSpecial) {
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm w-fit ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  }`}
                >
                  <Settings size={16} />
                  {link.name}
                </Link>
              );
            }

            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block font-medium ${
                  isActive ? "text-blue-600 underline" : "text-gray-700"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-2">
            {user ? (
              <div className="flex items-center gap-3">
                {isEducator && (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                    <GraduationCap size={14} />
                    Educator
                  </div>
                )}
                <UserButton />
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openSignIn();
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold"
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

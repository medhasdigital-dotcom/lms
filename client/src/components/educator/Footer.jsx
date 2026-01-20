import React from "react";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { 
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  Mail, Phone, MapPin, Heart, ExternalLink, ArrowUpRight
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: "Dashboard", path: "/educator" },
      { name: "My Courses", path: "/educator/my-courses" },
      { name: "Add Course", path: "/educator/add-course" },
      { name: "Students", path: "/educator/student-enrolled" },
    ],
    resources: [
      { name: "Help Center", path: "#" },
      { name: "Teaching Tips", path: "#" },
      { name: "Community", path: "#" },
      { name: "Blog", path: "#" },
    ],
    legal: [
      { name: "Terms of Service", path: "#" },
      { name: "Privacy Policy", path: "#" },
      { name: "Cookie Policy", path: "#" },
      { name: "Instructor Terms", path: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-600" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-500" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-600" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-700" },
    { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-600" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      

      {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500 flex items-center gap-1">
              © {currentYear} Rk Consulting Made with 
              <Heart size={14} className="text-red-500 fill-red-500" /> 
              All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 ${social.color} transition-all`}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
    </footer>
  );
};

export default Footer;

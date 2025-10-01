import React from "react";
import logo from "../../../logo.jpg";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-primary-banner text-primary-cta shadow-soft">
      <div className="container-responsive section-padding-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-responsive">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img
                src={logo}
                alt="Hubinity logo"
                className="w-8 h-8 rounded-lg object-cover mr-2 shadow-soft"
              />
              <span className="text-2xl font-garamond font-bold">Hubinity</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Connecting talented students with innovative startups. Build your
              future, one project at a time.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/hubinity.in?igsh=MXg1MHQydXlpczRvZg=="
                className="text-gray-300 hover:text-primary-button transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-garamond font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-primary-button transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/tasks"
                  className="text-gray-300 hover:text-primary-button transition-colors"
                >
                  Browse Tasks
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-gray-300 hover:text-primary-button transition-colors"
                >
                  Join as Student
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-gray-300 hover:text-primary-button transition-colors"
                >
                  Join as Startup
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-garamond font-semibold mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary-button" />
                <span className="text-gray-300">
                  For support, mail us at:{" "}
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=support@hubinity.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary-button transition-colors"
                    aria-label="Email support"
                  >
                    support@hubinity.in
                  </a>
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary-button" />
                <span className="text-gray-300">
                  For information, mail us at:{" "}
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=info@hubinity.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary-button transition-colors"
                    aria-label="Email info"
                  >
                    info@hubinity.in
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2025 Hubinity. All rights reserved.
            </p>
            <div className="flex mt-4 md:mt-0">
              <Link
                to="/help"
                className="text-gray-300 hover:text-primary-button text-sm transition-colors"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

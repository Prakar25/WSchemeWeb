/* eslint-disable no-unused-vars */
import React from "react";

import { FaFacebook, FaTwitter } from "react-icons/fa";

const Footer = () => {
  const d = new Date();

  return (
    <section>
      <footer className="bg-blue-900 text-white py-12 mt-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10 px-6">
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>FAQs</li>
              <li>Grievance Redressal</li>
              <li>Helpline Numbers</li>
              <li>Terms of Service</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
            <p className="text-sm font-bold">
              Women & Child Development Department
            </p>
            <p className="mt-1 text-sm">
              Lingding Rd, Upper Tadong, Tadong, Gangtok, Sikkim 737102
            </p>
            <p className="text-sm mt-2">Email: contact@wcd.sikkim.gov.in</p>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Follow Us</h3>
            <div className="flex gap-4">
              <FaFacebook />
              <FaTwitter />
            </div>
          </div>
        </div>

        <div className="text-center text-xs mt-10 opacity-70">
          ©{d.getFullYear()} Women and Child Welfare Department, Government of
          Sikkim. All Rights Reserved.
        </div>
      </footer>
    </section>
  );
};

export default Footer;

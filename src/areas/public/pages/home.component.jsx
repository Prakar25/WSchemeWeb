/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";

import childCareImg from "../../../assets/childCare.jpeg";
import motherImg from "../../../assets/expectingMother.jpeg";
import educationImg from "../../../assets/educationFinance.jpeg";
import childHealthImg from "../../../assets/childHealth.jpeg";
import childDevImg from "../../../assets/childDevelopment.jpeg";
import womenEmpImg from "../../../assets/womenEmpowerment.jpeg";

// Card Animation Variants
const cardVariants = {
  offscreen: { opacity: 0, y: 50 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: "easeOut" },
  },
};

// Container Animation for Stagger
const containerVariants = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.3, // stagger between cards
    },
  },
};

// Reusable Card Component
const SchemeCard = ({ img, title, description }) => (
  <motion.div
    variants={cardVariants}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="bg-white shadow rounded-lg p-4"
  >
    <img src={img} className="rounded-md h-64 w-full object-cover" />
    <h3 className="font-semibold mt-4">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
);

const Home = () => {
  const schemes = [
    {
      img: childCareImg,
      title: "Scheme for Child Care",
      description: "Provides daycare services for children of working mothers.",
    },
    {
      img: motherImg,
      title: "Support for Expectant Mothers",
      description:
        "Offers financial assistance and healthcare support during pregnancy.",
    },
    {
      img: educationImg,
      title: "Financial Aid for Education",
      description:
        "Supports education for girls from disadvantaged backgrounds.",
    },
    {
      img: childHealthImg,
      title: "National Child Health Program",
      description:
        "Ensures comprehensive health services for children up to 18 years.",
    },
    {
      img: childDevImg,
      title: "Integrated Child Development Services",
      description: "Provides early childhood care and development services.",
    },
    {
      img: womenEmpImg,
      title: "Women Empowerment Scheme",
      description: "Promotes economic and social empowerment of women.",
    },
  ];

  return (
    <section className="min-h-screen">
      <div className="w-full">
        {/* Hero Section */}
        <div className="text-center py-14 bg-gray-50">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-4xl font-bold text-blue-900"
          >
            Access Government Welfare Schemes Online
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mt-3 text-gray-700 max-w-2xl mx-auto"
          >
            A single point of access for all welfare schemes for women and
            children from the State & Central Government.
          </motion.p>

          {/* Search Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="bg-white shadow-md w-full max-w-3xl mx-auto mt-10 p-6 rounded-lg"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <select className="border rounded-md p-2 w-full">
                <option>Eligibility</option>
                <option>All</option>
              </select>

              <select className="border rounded-md p-2 w-full">
                <option>Age Group</option>
                <option>All</option>
              </select>

              <select className="border rounded-md p-2 w-full">
                <option>Category</option>
                <option>All</option>
              </select>
            </div>

            <button className="mt-5 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
              Search Schemes
            </button>
          </motion.div>
        </div>

        {/* Scheme Cards with Slow Fade In Up Animation */}
        <motion.div
          className="max-w-7xl mx-auto mt-16 px-6 grid md:grid-cols-3 gap-8"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {schemes.map((scheme, index) => (
            <SchemeCard key={index} {...scheme} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Home;

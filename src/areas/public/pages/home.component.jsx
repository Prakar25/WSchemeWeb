/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import axios from "../../../api/axios";
import { SCHEMES_CONFIG_URL } from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";

// Card Animation Variants
const cardVariants = {
  offscreen: { opacity: 0, y: 40 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

// Container Animation for Stagger
const containerVariants = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const Home = () => {
  const [schemesList, setSchemesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const getSchemesList = async () => {
    try {
      const response = await axios.get(SCHEMES_CONFIG_URL);

      if (response.status === 200) {
        setSchemesList(response.data);
      }
    } catch (error) {
      console.error("getSchemesList", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSchemesList();
  }, []);

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="text-center py-14">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl font-bold text-primary"
        >
          Access Government Welfare Schemes Online
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mt-3 text-gray-700 max-w-2xl mx-auto"
        >
          A single point of access for all welfare schemes for women and
          children from the State & Central Government.
        </motion.p>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
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

          <button className="mt-5 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition">
            Search Schemes
          </button>
        </motion.div>
      </div>

      {/* Schemes Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          // Loading state
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-96 bg-gray-200 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : schemesList?.length === 0 ? (
          // Empty schemes list
          <p className="text-center text-gray-500 py-20">
            No schemes available at the moment.
          </p>
        ) : (
          // Schemes Cards
          <motion.div
            className="grid md:grid-cols-3 gap-8 mt-16"
            initial="offscreen"
            animate="onscreen"
            variants={containerVariants}
          >
            {schemesList.map((scheme) => (
              <SchemeCard key={scheme._id || scheme.scheme_id} scheme={scheme} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Home;

// Scheme Card Component

const SchemeCard = ({ scheme }) => {
  const { scheme_image_file_url, scheme_name, scheme_description } = scheme;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.97 }}
      className="bg-white shadow-lg rounded-xl overflow-hidden cursor-pointer"
    >
      <img
        src={displayMedia(scheme_image_file_url)}
        alt={scheme_name}
        className="h-64 w-full object-cover"
      />

      <div className="p-5">
        <h3 className="font-semibold text-lg text-primary mb-2">
          {scheme_name}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-3">
          {scheme_description}
        </p>
      </div>
    </motion.div>
  );
};

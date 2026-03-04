/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import axios from "../../../api/axios";
import { SCHEMES_CONFIG_URL, CATEGORIES_SIMPLE_URL } from "../../../api/api_routing_urls";
import { displayMedia } from "../../../utils/uploadFiles/uploadFileToServerController";

// Static age options (interval of 10, 20–70, then 70+)
const AGE_OPTIONS = [
  { value: "", label: "Age Group" },
  { value: "all", label: "All" },
  { value: "20-30", label: "20 - 30" },
  { value: "30-40", label: "30 - 40" },
  { value: "40-50", label: "40 - 50" },
  { value: "50-60", label: "50 - 60" },
  { value: "60-70", label: "60 - 70" },
  { value: "70_and_above", label: "70 and above" },
];

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
  const [categories, setCategories] = useState([]);
  const [ageGroup, setAgeGroup] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const getSchemesList = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("approved_only", "true");
      params.append("filter_type", "scheme");
      if (ageGroup && ageGroup !== "all") params.append("age_group", ageGroup);
      if (categoryId && categoryId !== "all") params.append("category_id", categoryId);

      const url = `${SCHEMES_CONFIG_URL}?${params.toString()}`;
      const response = await axios.get(url);

      if (response.status === 200) {
        const raw = response.data?.data ?? response.data?.schemes ?? response.data;
        const schemes = Array.isArray(raw) ? raw : [];
        const approvedSchemes = schemes.filter(
          (scheme) =>
            !scheme.approval_status || scheme.approval_status === "approved"
        );
        setSchemesList(approvedSchemes);
      }
    } catch (error) {
      console.error("getSchemesList", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(CATEGORIES_SIMPLE_URL);
      if (response.status === 200) {
        const data = response.data?.categories ?? response.data ?? [];
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("fetchCategories", error);
    }
  };

  useEffect(() => {
    getSchemesList();
    fetchCategories();
  }, []);

  const handleSearch = () => {
    getSchemesList();
  };

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
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="border rounded-md p-2 w-full"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            >
              {AGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className="border rounded-md p-2 w-full"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Category</option>
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.category_name || cat.name || cat.categoryName || cat._id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="mt-5 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
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

      <div className="p-5 text-center">
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

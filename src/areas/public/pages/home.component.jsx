/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import axios from "../../../api/axios";
import SplitText from "../../../reusable-components/SplitText/SplitText";
import AdsSection from "../../../reusable-components/FlowingMenu/AdsSection";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../../reusable-components/AlertDialog";
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
    fetchCategories();
  }, []);

  useEffect(() => {
    getSchemesList();
  }, [ageGroup, categoryId]);

  const handleSearch = () => {
    getSchemesList();
  };

  return (
    <section className="min-h-screen">
      {/* Ads – full width, half viewport height, just below top bar */}
      <div className="w-full overflow-hidden" style={{ height: "4.375vh", minHeight: "35px" }}>
        <AdsSection className="w-full h-full" height="100%" />
      </div>

      {/* Hero Section */}
      <div className="text-center py-12 sm:py-16 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#d85a30] max-w-4xl mx-auto leading-tight px-2">
          <SplitText text="Access Government Welfare" tag="span" splitType="chars" delay={35} className="block" />
          <SplitText text="Schemes Online" tag="span" splitType="chars" delay={35} className="block mt-1" />
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-black max-w-2xl mx-auto text-base sm:text-lg"
        >
          A single point of access for all welfare schemes for women and
          children from the State & Central Government.
        </motion.p>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/90 backdrop-blur shadow-lg shadow-[#d85a30]/10 w-full max-w-2xl mx-auto mt-10 p-6 sm:p-8 rounded-2xl border border-[#c2edda]/40"
        >
          <p className="text-black text-sm font-medium mb-4">Filter schemes by age and category</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-black text-xs font-medium mb-1.5">Age Group</label>
              <select
                className="w-full border border-[#68d388]/40 rounded-xl px-4 py-3 text-black bg-white focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] transition-all"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
              >
                {AGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-black text-xs font-medium mb-1.5">Category</label>
              <select
                className="w-full border border-[#68d388]/40 rounded-xl px-4 py-3 text-black bg-white focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] transition-all"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category</option>
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.category_name || cat.name || cat.categoryName || cat._id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="mt-6 w-full bg-[#d85a30] text-white py-3 rounded-xl font-semibold hover:bg-[#ffb766] active:scale-[0.99] transition-all"
          >
            Search Schemes
          </button>
          <p className="mt-3 text-black/70 text-xs text-center">Results update automatically when you change filters</p>
          <div className="mt-4 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    className="text-sm text-[#d85a30] hover:text-[#ffb766] underline underline-offset-2 transition-colors"
                  >
                    Need help?
                  </button>
                }
              />
              <AlertDialogPopup from="bottom" className="sm:max-w-[425px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>About welfare schemes</AlertDialogTitle>
                  <AlertDialogDescription>
                    Use the filters above to narrow schemes by age group and category. Results update automatically.
                    Click any scheme card to view full details and apply.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Got it</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogPopup>
            </AlertDialog>
          </div>
        </motion.div>
      </div>

      {/* Schemes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-8 mt-8">
          <SplitText text="Available Schemes" splitType="chars" delay={30} className="inline-block" />
        </h2>

        {loading ? (
          // Loading state
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-[#c2edda]/20 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : schemesList?.length === 0 ? (
          // Empty schemes list
          <div className="text-center py-20 px-6 bg-[#c2edda]/10 rounded-2xl border border-[#c2edda]/30">
            <p className="text-black text-lg font-medium">No schemes found</p>
            <p className="text-black/70 text-sm mt-2">Try adjusting your filters or check back later for new schemes.</p>
          </div>
        ) : (
          // Schemes Cards
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
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
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98 }}
      className="group bg-white shadow-md shadow-[#d85a30]/5 hover:shadow-xl hover:shadow-[#d85a30]/10 rounded-2xl overflow-hidden cursor-pointer border border-[#c2edda]/20 hover:border-[#d85a30]/30 transition-all duration-300"
    >
      <div className="h-52 w-full overflow-hidden bg-[#c2edda]/20">
        {scheme_image_file_url ? (
          <img
            src={displayMedia(scheme_image_file_url)}
            alt={scheme_name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-5xl font-bold text-[#d85a30]/30">{(scheme_name || "S").charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="p-5 text-center">
        <h3 className="font-semibold text-lg text-[#d85a30] mb-2 group-hover:text-[#ffb766] transition-colors">
          {scheme_name}
        </h3>

        <p className="text-sm text-black line-clamp-3">
          {scheme_description || "View details for more information."}
        </p>
        <p className="mt-3 text-sm text-[#d85a30] font-medium">View details →</p>
      </div>
    </motion.div>
  );
};

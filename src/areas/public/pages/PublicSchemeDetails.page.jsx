/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../../../api/axios";
import { SCHEMES_CONFIG_URL } from "../../../api/api_routing_urls";
import ViewSchemeDetails from "../dashboard/viewSchemeDetails.component";

/**
 * Public scheme details page - viewable without login.
 * Accessible at /scheme/:schemeId
 * Renders inside PublicLayout (navbar + footer already provided).
 */
export default function PublicSchemeDetailsPage() {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const schemeFromState = location.state?.scheme;
    if (schemeFromState && (schemeFromState._id === schemeId || schemeFromState.scheme_id === schemeId)) {
      setScheme(schemeFromState);
      setLoading(false);
      return;
    }

    const fetchScheme = async () => {
      if (!schemeId) {
        setError("Scheme not found");
        setLoading(false);
        return;
      }
      try {
        let data = null;
        try {
          const response = await axios.get(`${SCHEMES_CONFIG_URL}/${schemeId}`);
          data = response.data?.data ?? response.data?.scheme ?? response.data;
        } catch {
          const listRes = await axios.get(`${SCHEMES_CONFIG_URL}?approved_only=true`);
          const raw = listRes.data?.data ?? listRes.data?.schemes ?? listRes.data;
          const schemes = Array.isArray(raw) ? raw : [];
          data = schemes.find(
            (s) => (s._id || s.scheme_id) === schemeId
          ) || null;
        }
        if (data && (data._id || data.scheme_id)) {
          setScheme(data);
        } else {
          setError("Scheme not found");
        }
      } catch (err) {
        console.error("Error fetching scheme:", err);
        setError("Failed to load scheme details.");
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [schemeId]);

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="animate-pulse text-center">
          <div className="h-12 w-64 bg-[#c2edda]/30 rounded-lg mx-auto mb-4" />
          <div className="h-4 w-48 bg-[#c2edda]/20 rounded mx-auto" />
          <p className="text-black/70 mt-4">Loading scheme details...</p>
        </div>
      </main>
    );
  }

  if (error || !scheme) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <p className="text-black font-medium mb-4">{error || "Scheme not found"}</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-[#d85a30] hover:text-[#ffb766] font-medium"
        >
          ← Back to home
        </button>
      </main>
    );
  }

  return (
    <ViewSchemeDetails scheme={scheme} onClose={handleClose} />
  );
}

import { useState, useEffect } from "react";
import axios from "../../api/axios";
import { ADS_PUBLIC_URL } from "../../api/api_routing_urls";
import { displayMedia } from "../../utils/uploadFiles/uploadFileToServerController";
import FlowingMenu from "./FlowingMenu";

const DEFAULT_ITEMS = [
  { link: "#", text: "Welfare Schemes", image: "" },
];

/**
 * Fetches active ads from API and renders FlowingMenu. Used on home (logged out) and public user dashboard.
 */
export default function AdsSection({ className = "", height = "400px" }) {
  const isFullHeight = height === "100%";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await axios.get(ADS_PUBLIC_URL);
        const data = res.data?.data ?? res.data?.ads ?? res.data;
        const list = Array.isArray(data) ? data : [];
        const mapped = list
          .filter((ad) => ad.active !== false)
          .map((ad) => ({
            id: ad._id || ad.id,
            link: ad.link || ad.url || "#",
            text: ad.text || ad.title || ad.name || "Ad",
            image: ad.image?.url ? displayMedia(ad.image.url) : ad.image_url || ad.image || "",
          }))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setItems(mapped.length ? mapped : DEFAULT_ITEMS);
      } catch (err) {
        console.error("Ads fetch failed:", err);
        setItems(DEFAULT_ITEMS);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <div className={className} style={{ height: isFullHeight ? "100%" : height, position: "relative", minHeight: "35px" }}>
      <FlowingMenu
        items={items}
        speed={18}
        textColor="#ffffff"
        bgColor="#0a0a0f"
        marqueeBgColor="#ffffff"
        marqueeTextColor="#0a0a0f"
        borderColor="rgba(255,255,255,0.2)"
      />
    </div>
  );
}

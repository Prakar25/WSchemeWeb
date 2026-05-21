/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { MdCampaign, MdAdd, MdEdit, MdDelete, MdCloudUpload } from "react-icons/md";

import axios from "../../../../api/axios";
import { ADS_ADMIN_LIST_URL, ADS_ADMIN_CREATE_URL, ADS_ADMIN_UPDATE_URL, ADS_ADMIN_DELETE_URL } from "../../../../api/api_routing_urls";
import Dashboard from "../../../dashboard-components/dashboard.component";
import Spinner from "../../../../reusable-components/spinner/spinner.component";
import showToast from "../../../../utils/notification/NotificationModal";
import { displayMedia, uploadFileToServer } from "../../../../utils/uploadFiles/uploadFileToServerController";
import { useConfirm } from "../../../../reusable-components/ConfirmDialog/ConfirmDialogProvider";

export default function AdvertisementPage() {
  const confirm = useConfirm();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ text: "", link: "#", image_url: "", order: 0, active: true });
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAds = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(ADS_ADMIN_LIST_URL);
      const data = res.data?.data ?? res.data?.ads ?? res.data;
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch ads failed:", err);
      setError(err.response?.data?.message || "Failed to load advertisements. Ensure the backend API is implemented.");
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${ADS_ADMIN_UPDATE_URL}/${editingId}`, form);
        showToast("Ad updated.", "success");
      } else {
        await axios.post(ADS_ADMIN_CREATE_URL, form);
        showToast("Ad created.", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ text: "", link: "#", image_url: "", order: 0, active: true });
      fetchAds();
    } catch (err) {
      showToast(err.response?.data?.message || "Save failed. Ensure the backend API is implemented.", "error");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete advertisement?",
      description: "This advertisement will be deleted permanently.",
      confirmText: "Yes, delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await axios.delete(`${ADS_ADMIN_DELETE_URL}/${id}`);
      showToast("Ad deleted.", "success");
      fetchAds();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  const startEdit = (ad) => {
    setEditingId(ad._id || ad.id);
    const imgUrl = ad.image?.url || ad.image_url || ad.image || "";
    setForm({
      text: ad.text || ad.title || "",
      link: ad.link || ad.url || "#",
      image_url: imgUrl,
      order: ad.order ?? 0,
      active: ad.active !== false,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image (JPEG, PNG, GIF, or WebP).", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB.", "error");
      return;
    }
    setImageUploading(true);
    try {
      const filePath = await uploadFileToServer(file, "admin-uploads");
      if (filePath) {
        const fullPath = filePath.startsWith("public") ? filePath : `public${filePath}`;
        setForm((f) => ({ ...f, image_url: fullPath }));
        showToast("Image uploaded successfully.", "success");
      } else {
        showToast("Image upload failed. Try again.", "error");
      }
    } catch (err) {
      showToast("Image upload failed.", "error");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dashboard sidebarType="System Admin">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MdCampaign className="text-2xl text-[#d85a30]" />
          <h1 className="text-2xl font-bold text-gray-900">Advertisement</h1>
        </div>
        <p className="text-gray-600 text-sm mb-6">
          Manage ads shown on the public homepage and public user dashboard. Only Super Admin can configure these. Ads appear in the FlowingMenu section.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ text: "", link: "#", image_url: "", order: 0, active: true });
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] font-medium"
          >
            <MdAdd size={20} /> Add Ad
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">{editingId ? "Edit Ad" : "New Ad"}</h3>
            <div className="grid gap-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title / Text</label>
                <input
                  type="text"
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  placeholder="e.g. Welfare Schemes"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {imageUploading ? (
                      <>
                        <Spinner />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <MdCloudUpload size={20} />
                        Upload image
                      </>
                    )}
                  </button>
                  {form.image_url && (
                    <>
                      <div className="flex items-center gap-2">
                        <img
                          src={displayMedia(form.image_url)}
                          alt="Ad preview"
                          className="h-16 w-auto max-w-[120px] object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">JPEG, PNG, GIF or WebP. Max 5MB.</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="rounded border-gray-300 text-[#d85a30] focus:ring-[#d85a30]"
                  />
                  <span className="text-sm text-gray-700">Active (show on site)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="px-4 py-2 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] font-medium">
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-600">No advertisements yet. Add one to show on the home and public dashboard.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {ads.map((ad) => (
              <li
                key={ad._id || ad.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {ad.image?.url || ad.image_url || ad.image ? (
                    <img
                      src={displayMedia(ad.image?.url || ad.image_url || ad.image)}
                      alt=""
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{ad.text || ad.title}</p>
                    <p className="text-sm text-gray-500">{ad.link || ad.url || "—"}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${ad.active !== false ? "bg-[#c2edda]/30 text-black" : "bg-gray-200 text-gray-600"}`}>
                      {ad.active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(ad)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Edit"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ad._id || ad.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Delete"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dashboard>
  );
}

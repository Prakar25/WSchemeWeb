import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiEdit2, FiUsers } from "react-icons/fi";

import axios from "../../../api/axios";
import {
  PUBLIC_PROFILE_HOUSEHOLD_MEMBERS_URL,
  publicProfileHouseholdMemberByIdUrl,
} from "../../../api/api_routing_urls";
import PublicHeader from "../components/PublicHeader.component";
import Footer from "../footer.component";
import {
  getStoredAccountUserId,
  getStoredActiveApplicantId,
  mergePublicApiParams,
  maskAadhaar,
  getProfileKycBadgeLabel,
  getCscBadgeLabel,
  getKycMissingFields,
  formatKycMissingFieldsList,
  setActiveApplicantSelection,
  setStoredActiveApplicantProfile,
} from "../../../utils/user.utils";
import { useActiveApplicantId } from "../../../hooks/useActiveApplicantId";
import showToast from "../../../utils/notification/NotificationModal";
import {
  getCountries,
  getDistrictsForState,
  getStatesForCountry,
} from "../../../utils/locationOptions";
import FormSelect from "../../../reusable-components/inputs/FormSelect/FormSelect";

function getMemberName(m) {
  return m?.fullName || m?.demographics?.fullName || m?.name || "—";
}

function getMemberAadhaar(m) {
  return m?.aadhaarNumber || m?.aadhaar_number || m?.uid_no || null;
}

function getMemberGender(m) {
  const g = m?.gender || m?.demographics?.gender;
  if (!g) return "—";
  return g === "M" ? "Male" : g === "F" ? "Female" : g === "O" ? "Other" : String(g);
}

function getMemberDob(m) {
  const d = m?.dob || m?.demographics?.dob?.date || m?.demographics?.dob;
  if (!d) return "—";
  try {
    const dt = new Date(typeof d === "string" ? d : d?.date || d);
    return isNaN(dt.getTime()) ? "—" : dt.toISOString().split("T")[0];
  } catch {
    return "—";
  }
}

function getMemberRelation(m) {
  return m?.relationToPrimary || m?.relationWithApplicant || null;
}

function memberToEditForm(m) {
  const addr = m.address || {};
  const dobRaw = m?.dob ?? m?.demographics?.dob?.date ?? m?.demographics?.dob;
  let dob = "";
  if (dobRaw) {
    try {
      const d = new Date(typeof dobRaw === "string" ? dobRaw : dobRaw?.date || dobRaw);
      if (!isNaN(d.getTime())) dob = d.toISOString().split("T")[0];
    } catch {
      /* ignore */
    }
  }
  const rawAadhaar = getMemberAadhaar(m);
  const aadhaarDigits = rawAadhaar ? String(rawAadhaar).replace(/\D/g, "").slice(0, 12) : "";
  return {
    aadhaarNumber: aadhaarDigits,
    fullName: m?.demographics?.fullName || m?.fullName || "",
    gender: m?.gender || m?.demographics?.gender || "",
    relationToPrimary: (m?.relationToPrimary || "").trim(),
    dob,
    email: m?.contact?.email?.value ?? m?.contactEmail ?? m?.email ?? "",
    careOf: addr.careOf || "",
    house: addr.house || "",
    street: addr.street || "",
    locality: addr.locality || "",
    district: addr.district || "",
    state: addr.state || "",
    pincode: addr.pincode != null ? String(addr.pincode) : "",
    country: addr.country || "India",
  };
}

const emptyAddForm = () => ({
  aadhaarNumber: "",
  fullName: "",
  gender: "",
  relationToPrimary: "",
  dob: "",
  email: "",
  careOf: "",
  house: "",
  street: "",
  locality: "",
  district: "",
  state: "",
  pincode: "",
  country: "India",
});

export default function HouseholdMembersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [addForm, setAddForm] = useState(() => emptyAddForm());
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState(() => emptyAddForm());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editShowAddress, setEditShowAddress] = useState(false);
  const [editLocationUi, setEditLocationUi] = useState({
    country: "India",
    state: "",
    district: "",
  });
  const activeApplicantId = useActiveApplicantId();

  const accountUserId = useMemo(() => getStoredAccountUserId(), []);

  const [locationUi, setLocationUi] = useState({
    country: "India",
    state: "",
    district: "",
  });

  const authParams = useMemo(
    () => mergePublicApiParams({ userId: accountUserId }),
    [accountUserId]
  );

  const loadMembers = useCallback(async () => {
    if (!accountUserId) return;
    try {
      setLoading(true);
      const res = await axios.get(PUBLIC_PROFILE_HOUSEHOLD_MEMBERS_URL, {
        params: authParams,
        withCredentials: true,
      });
      const data = res.data || {};
      const list =
        data.status === "success" && Array.isArray(data.members) ? data.members : [];
      setMembers(list);
    } catch {
      setMembers([]);
      showToast("Could not load household members.", "error");
    } finally {
      setLoading(false);
    }
  }, [accountUserId, authParams]);

  useEffect(() => {
    if (!accountUserId) {
      showToast("Please login again.", "error");
      navigate("/login", { replace: true });
      return;
    }
    loadMembers();
  }, [accountUserId, navigate, loadMembers]);

  const onSelectMember = (m) => {
    if (!setActiveApplicantSelection(m)) {
      showToast("Could not switch applicant (missing member id). Refresh the list and try again.", "error");
      return;
    }
    const first = getMemberName(m).trim().split(/\s+/)[0] || "Member";
    showToast(`Now applying as ${first}`, "success");
  };

  const updateAddField = (key, value) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };

  const onAddHouseholdMember = async (e) => {
    e.preventDefault();
    const aadhaarDigits = String(addForm.aadhaarNumber || "").replace(/\D/g, "");
    if (aadhaarDigits.length !== 12) {
      showToast("Aadhaar must be exactly 12 digits.", "error");
      return;
    }
    const fullName = (addForm.fullName || "").trim();
    if (!fullName) {
      showToast("Full name is required.", "error");
      return;
    }
    if (!addForm.gender || !["M", "F", "O"].includes(addForm.gender)) {
      showToast("Please select gender (M, F, or O).", "error");
      return;
    }
    const pin = (addForm.pincode || "").trim();
    if (pin && !/^[0-9]{6}$/.test(pin)) {
      showToast("Pincode must be 6 digits if provided.", "error");
      return;
    }
    const rel = (addForm.relationToPrimary || "").trim();
    if (!rel) {
      showToast("Relation to primary is required.", "error");
      return;
    }
    if (rel.length > 64) {
      showToast("Relation to primary must be at most 64 characters.", "error");
      return;
    }
    const emailTrim = (addForm.email || "").trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      showToast("Enter a valid email or leave it blank.", "error");
      return;
    }

    const body = {
      aadhaarNumber: aadhaarDigits,
      fullName,
      gender: addForm.gender,
      relationToPrimary: rel,
    };
    if (addForm.dob) body.dob = addForm.dob;
    if (emailTrim) body.email = emailTrim;
    const addrKeys = [
      "careOf",
      "house",
      "street",
      "locality",
      "district",
      "state",
      "pincode",
      "country",
    ];
    for (const k of addrKeys) {
      const v = (addForm[k] || "").trim();
      if (v) body[k] = v;
    }

    setAddSubmitting(true);
    try {
      const res = await axios.post(PUBLIC_PROFILE_HOUSEHOLD_MEMBERS_URL, body, {
        params: authParams,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const created = res.data?.created;
      showToast(
        created === false ? "Household member updated." : "Household member added.",
        "success"
      );
      setAddForm(emptyAddForm());
      setLocationUi({ country: "India", state: "", district: "" });
      await loadMembers();
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (status === 403
          ? "Only the primary account holder can add or update household members."
          : "Could not save household member.");
      showToast(msg, "error");
    } finally {
      setAddSubmitting(false);
    }
  };

  const updateEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeEditMember = () => {
    setEditingMemberId(null);
    setEditForm(emptyAddForm());
    setEditLocationUi({ country: "India", state: "", district: "" });
    setEditShowAddress(false);
  };

  const openEditMember = (m) => {
    if (m?.isPrimary === true) {
      showToast("Edit the primary account holder under Complete profile.", "info");
      navigate("/user/complete-profile");
      return;
    }
    const id = m?._id || m?.personId || m?.beneficiaryPersonId;
    if (!id) {
      showToast("Missing member id.", "error");
      return;
    }
    const form = memberToEditForm(m);
    setEditForm(form);
    setEditLocationUi({
      country: form.country || "India",
      state: form.state || "",
      district: form.district || "",
    });
    setEditShowAddress(
      Boolean(
        String(form.careOf || "").trim() ||
          String(form.house || "").trim() ||
          String(form.street || "").trim() ||
          String(form.locality || "").trim() ||
          String(form.district || "").trim() ||
          String(form.state || "").trim() ||
          String(form.pincode || "").trim()
      )
    );
    setEditingMemberId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSaveEditMember = async (e) => {
    e.preventDefault();
    if (!editingMemberId) return;

    const fullName = (editForm.fullName || "").trim();
    if (!fullName) {
      showToast("Full name is required.", "error");
      return;
    }
    if (!editForm.gender || !["M", "F", "O"].includes(editForm.gender)) {
      showToast("Please select gender (M, F, or O).", "error");
      return;
    }
    const rel = (editForm.relationToPrimary || "").trim();
    if (!rel) {
      showToast("Relation to primary is required.", "error");
      return;
    }
    if (rel.length > 64) {
      showToast("Relation to primary must be at most 64 characters.", "error");
      return;
    }
    const pin = (editForm.pincode || "").trim();
    if (pin && !/^[0-9]{6}$/.test(pin)) {
      showToast("Pincode must be 6 digits if provided.", "error");
      return;
    }
    const emailTrim = (editForm.email || "").trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      showToast("Enter a valid email or leave it blank.", "error");
      return;
    }
    const aadhaarDigits = String(editForm.aadhaarNumber || "").replace(/\D/g, "");
    if (aadhaarDigits && aadhaarDigits.length !== 12) {
      showToast("Aadhaar must be exactly 12 digits if provided.", "error");
      return;
    }

    const body = {
      fullName,
      gender: editForm.gender,
      relationToPrimary: rel,
    };
    if (aadhaarDigits.length === 12) body.aadhaarNumber = aadhaarDigits;
    if (editForm.dob) body.dob = editForm.dob;
    if (emailTrim) body.email = emailTrim;
    const addrKeys = [
      "careOf",
      "house",
      "street",
      "locality",
      "district",
      "state",
      "pincode",
      "country",
    ];
    for (const k of addrKeys) {
      const v = (editForm[k] || "").trim();
      if (v) body[k] = v;
    }

    setEditSubmitting(true);
    try {
      const res = await axios.put(publicProfileHouseholdMemberByIdUrl(editingMemberId), body, {
        params: authParams,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.data?.status === "success") {
        showToast(res.data?.message || "Member updated.", "success");
        const updated = res.data?.member;
        const activeId = getStoredActiveApplicantId();
        if (updated && activeId && String(activeId) === String(editingMemberId)) {
          setStoredActiveApplicantProfile(updated);
        }
        closeEditMember();
        await loadMembers();
      } else {
        showToast(res.data?.message || "Update failed.", "error");
      }
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (status === 403
          ? "You cannot update this member."
          : "Could not update household member.");
      showToast(msg, "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Household Members</h1>
          <p className="text-gray-600 mt-1">
            Add people in your household (Aadhaar, name, gender, and relation to you). Choose who you
            are applying for below.
          </p>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
            <FiUsers className="text-[#d85a30]" />
            Add household member
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Required: 12-digit Aadhaar, full name, gender, and relation to primary. If this Aadhaar
            already exists as a non-primary member in your household, your details will be merged
            (update).
          </p>

          <form onSubmit={onAddHouseholdMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Aadhaar number *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  value={addForm.aadhaarNumber}
                  onChange={(e) =>
                    updateAddField("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  placeholder="12 digits"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                <input
                  type="text"
                  value={addForm.fullName}
                  onChange={(e) => updateAddField("fullName", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                <select
                  value={addForm.gender}
                  onChange={(e) => updateAddField("gender", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] bg-white"
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Relation to primary *
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={addForm.relationToPrimary}
                  onChange={(e) => updateAddField("relationToPrimary", e.target.value)}
                  placeholder="e.g. Spouse, Son, Daughter"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of birth</label>
                <input
                  type="date"
                  value={addForm.dob}
                  onChange={(e) => updateAddField("dob", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 [color-scheme:light] focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => updateAddField("email", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddress((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-[#d85a30] hover:text-[#b84a28]"
            >
              {showAddress ? <FiChevronUp /> : <FiChevronDown />}
              Address (optional)
            </button>

            {showAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Care of</label>
                  <input
                    type="text"
                    value={addForm.careOf}
                    onChange={(e) => updateAddField("careOf", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">House</label>
                  <input
                    type="text"
                    value={addForm.house}
                    onChange={(e) => updateAddField("house", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Street</label>
                  <input
                    type="text"
                    value={addForm.street}
                    onChange={(e) => updateAddField("street", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Locality</label>
                  <input
                    type="text"
                    value={addForm.locality}
                    onChange={(e) => updateAddField("locality", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <FormSelect
                  label="Country"
                  value={locationUi.country}
                  onChange={(e) => {
                    const c = e.target.value;
                    setLocationUi({ country: c, state: "", district: "" });
                    updateAddField("country", c);
                    updateAddField("state", "");
                    updateAddField("district", "");
                  }}
                >
                  {getCountries().map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="State"
                  value={locationUi.state}
                  onChange={(e) => {
                    const s = e.target.value;
                    setLocationUi((p) => ({ ...p, state: s, district: "" }));
                    updateAddField("state", s);
                    updateAddField("district", "");
                  }}
                >
                  <option value="">Select State</option>
                  {locationUi.state &&
                    !getStatesForCountry(locationUi.country).includes(locationUi.state) && (
                      <option value={locationUi.state}>{locationUi.state}</option>
                    )}
                  {getStatesForCountry(locationUi.country).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="District"
                  value={locationUi.district}
                  onChange={(e) => {
                    const d = e.target.value;
                    setLocationUi((p) => ({ ...p, district: d }));
                    updateAddField("district", d);
                  }}
                  disabled={!locationUi.state}
                >
                  <option value="">{locationUi.state ? "Select District" : "Select State first"}</option>
                  {locationUi.district &&
                    !getDistrictsForState(locationUi.state).includes(locationUi.district) && (
                      <option value={locationUi.district}>{locationUi.district}</option>
                    )}
                  {getDistrictsForState(locationUi.state).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </FormSelect>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pincode (6 digits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={addForm.pincode}
                    onChange={(e) =>
                      updateAddField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={addSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] font-semibold text-sm disabled:opacity-60"
              >
                {addSubmitting ? "Saving…" : "Save household member"}
              </button>
            </div>
          </form>
        </section>

        {editingMemberId && (
          <section className="bg-white rounded-xl shadow-sm border-2 border-[#d85a30]/40 p-6 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit household member</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Save your changes below. The primary account holder cannot be edited here — use
                  Complete profile instead.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditMember}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={onSaveEditMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Aadhaar (optional change)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    value={editForm.aadhaarNumber}
                    onChange={(e) =>
                      updateEditField("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                    placeholder="12 digits if changing"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => updateEditField("fullName", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => updateEditField("gender", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30] bg-white"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Relation to primary *
                  </label>
                  <input
                    type="text"
                    maxLength={64}
                    value={editForm.relationToPrimary}
                    onChange={(e) => updateEditField("relationToPrimary", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of birth</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => updateEditField("dob", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 [color-scheme:light] focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => updateEditField("email", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d85a30] focus:border-[#d85a30]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditShowAddress((v) => !v)}
                className="flex items-center gap-1 text-sm font-medium text-[#d85a30] hover:text-[#b84a28]"
              >
                {editShowAddress ? <FiChevronUp /> : <FiChevronDown />}
                Address (optional)
              </button>

              {editShowAddress && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Care of</label>
                    <input
                      type="text"
                      value={editForm.careOf}
                      onChange={(e) => updateEditField("careOf", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">House</label>
                    <input
                      type="text"
                      value={editForm.house}
                      onChange={(e) => updateEditField("house", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Street</label>
                    <input
                      type="text"
                      value={editForm.street}
                      onChange={(e) => updateEditField("street", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Locality</label>
                    <input
                      type="text"
                      value={editForm.locality}
                      onChange={(e) => updateEditField("locality", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <FormSelect
                    label="Country"
                    value={editLocationUi.country}
                    onChange={(e) => {
                      const c = e.target.value;
                      setEditLocationUi({ country: c, state: "", district: "" });
                      updateEditField("country", c);
                      updateEditField("state", "");
                      updateEditField("district", "");
                    }}
                  >
                    {getCountries().map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </FormSelect>
                  <FormSelect
                    label="State"
                    value={editLocationUi.state}
                    onChange={(e) => {
                      const s = e.target.value;
                      setEditLocationUi((p) => ({ ...p, state: s, district: "" }));
                      updateEditField("state", s);
                      updateEditField("district", "");
                    }}
                  >
                    <option value="">Select State</option>
                    {editLocationUi.state &&
                      !getStatesForCountry(editLocationUi.country).includes(editLocationUi.state) && (
                        <option value={editLocationUi.state}>{editLocationUi.state}</option>
                      )}
                    {getStatesForCountry(editLocationUi.country).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </FormSelect>
                  <FormSelect
                    label="District"
                    value={editLocationUi.district}
                    onChange={(e) => {
                      const d = e.target.value;
                      setEditLocationUi((p) => ({ ...p, district: d }));
                      updateEditField("district", d);
                    }}
                    disabled={!editLocationUi.state}
                  >
                    <option value="">
                      {editLocationUi.state ? "Select District" : "Select State first"}
                    </option>
                    {editLocationUi.district &&
                      !getDistrictsForState(editLocationUi.state).includes(editLocationUi.district) && (
                        <option value={editLocationUi.district}>{editLocationUi.district}</option>
                      )}
                    {getDistrictsForState(editLocationUi.state).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </FormSelect>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Pincode (6 digits)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={editForm.pincode}
                      onChange={(e) =>
                        updateEditField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#d85a30] text-white rounded-lg hover:bg-[#ffb766] font-semibold text-sm disabled:opacity-60"
                >
                  {editSubmitting ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={closeEditMember}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your household</h2>
            <p className="text-gray-600 text-sm mt-1">
              Choose who you are applying for. The selected member is used for schemes and
              applications.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-gray-600">Loading members…</div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
            <p className="text-gray-700 font-semibold">No household members yet.</p>
            <p className="text-gray-500 text-sm mt-1">
              Add a member above, or sign in as the account holder if the list is empty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((m, idx) => {
              const id = m?._id || m?.personId || m?.beneficiaryPersonId || String(idx);
              const selected =
                activeApplicantId &&
                String(m?._id ?? m?.personId ?? m?.beneficiaryPersonId ?? m?.id ?? "") ===
                  String(activeApplicantId);
              const aadhaar = getMemberAadhaar(m);
              const kycLabel = getProfileKycBadgeLabel(m);
              const cscLabel = getCscBadgeLabel(m);
              const missingKyc = formatKycMissingFieldsList(getKycMissingFields(m));
              const relation = getMemberRelation(m);
              const isPrimary = m?.isPrimary === true;

              return (
                <div
                  key={id}
                  className={`bg-white rounded-xl shadow-sm border p-5 ${
                    selected ? "border-[#d85a30]" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-gray-900 truncate">
                        {getMemberName(m)}
                      </div>
                      {relation && (
                        <div className="text-sm text-gray-500 mt-0.5">Relation: {relation}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        Aadhaar: {aadhaar ? maskAadhaar(aadhaar) : "—"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Gender: {getMemberGender(m)} • DOB: {getMemberDob(m)}
                      </div>
                      {missingKyc && (
                        <p className="text-xs text-amber-800 mt-1">
                          KYC needed: {missingKyc}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {isPrimary && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-white text-xs font-semibold">
                            Primary
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full bg-[#c2edda]/30 text-black text-xs font-semibold">
                          Profile: {kycLabel}
                        </span>
                        {cscLabel && (
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                            {cscLabel}
                          </span>
                        )}
                        {selected && (
                          <span className="px-2.5 py-1 rounded-full bg-[#d85a30] text-white text-xs font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditMember(m)}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
                      title={isPrimary ? "Edit primary (Complete profile)" : "Edit household member"}
                    >
                      <FiEdit2 />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectMember(m)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        selected
                          ? "bg-[#68d388]/25 text-black"
                          : "bg-[#d85a30] text-white hover:bg-[#ffb766]"
                      }`}
                    >
                      {selected ? "Selected" : "Select / Switch"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectMember(m);
                        navigate("/user/schemes");
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      Apply for schemes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectMember(m);
                        navigate("/user/applications");
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      View applications
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

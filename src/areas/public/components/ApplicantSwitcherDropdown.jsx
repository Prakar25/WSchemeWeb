/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FiCheck, FiChevronDown, FiUsers } from "react-icons/fi";
import axios from "../../../api/axios";
import { PUBLIC_PROFILE_HOUSEHOLD_MEMBERS_URL } from "../../../api/api_routing_urls";
import {
  ACTIVE_APPLICANT_CHANGED_EVENT,
  getStoredAccountUserId,
  getStoredActiveApplicantProfile,
  isProfileKycFull,
  mergePublicApiParams,
  resolveBeneficiaryPersonId,
  setActiveApplicantSelection,
} from "../../../utils/user.utils";
import { useActiveApplicantId } from "../../../hooks/useActiveApplicantId";
import showToast from "../../../utils/notification/NotificationModal";

function memberFirstName(member) {
  const full = member?.fullName || member?.demographics?.fullName || "";
  return full.trim().split(/\s+/)[0] || "Member";
}

function memberInitial(member) {
  return memberFirstName(member).charAt(0).toUpperCase() || "?";
}

function memberSubtitle(member) {
  const relation = (
    member?.relationToPrimary ||
    member?.relationWithApplicant ||
    ""
  ).trim();
  if (relation && !/^self$/i.test(relation)) return relation;
  if (member?.isPrimary === true) return "Primary";
  return null;
}

function getApplicantDisplay(activeApplicant) {
  if (!activeApplicant) {
    return { initial: "?", primary: "Select", secondary: null };
  }
  return {
    initial: memberInitial(activeApplicant),
    primary: memberFirstName(activeApplicant),
    secondary: memberSubtitle(activeApplicant),
  };
}

export default function ApplicantSwitcherDropdown() {
  const navigate = useNavigate();
  const activeApplicantId = useActiveApplicantId();
  const [activeApplicant, setActiveApplicant] = useState(() =>
    getStoredActiveApplicantProfile()
  );
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setActiveApplicant(getStoredActiveApplicantProfile());
    sync();
    window.addEventListener(ACTIVE_APPLICANT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ACTIVE_APPLICANT_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    setActiveApplicant(getStoredActiveApplicantProfile());
  }, [activeApplicantId]);

  const loadMembers = useCallback(async () => {
    const accountUserId = getStoredAccountUserId();
    if (!accountUserId) return;
    setLoadingMembers(true);
    try {
      const res = await axios.get(PUBLIC_PROFILE_HOUSEHOLD_MEMBERS_URL, {
        params: mergePublicApiParams({ userId: accountUserId }),
        withCredentials: true,
      });
      const list =
        res.data?.status === "success" && Array.isArray(res.data.members)
          ? res.data.members
          : [];
      setMembers(list);
      setMembersLoaded(true);
    } catch {
      if (!membersLoaded) setMembers([]);
      showToast("Could not load household members.", "error");
    } finally {
      setLoadingMembers(false);
    }
  }, [membersLoaded]);

  const handleOpen = () => {
    loadMembers();
  };

  const handleSelect = (member) => {
    const id = resolveBeneficiaryPersonId(member);
    if (id && String(id) === String(activeApplicantId)) return;
    if (!setActiveApplicantSelection(member)) {
      showToast("Could not switch applicant. Try again.", "error");
      return;
    }
    setActiveApplicant(member);
    showToast(`Now applying as ${memberFirstName(member)}`, "success");
  };

  const display = getApplicantDisplay(activeApplicant);

  return (
    <Menu as="div" className="relative">
      <MenuButton
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 max-w-[9.5rem] sm:max-w-[11rem] pl-1 pr-2 py-1 rounded-lg border border-gray-200/90 bg-gray-50 hover:bg-[#c2edda]/25 hover:border-[#68d388]/40 transition-colors focus:outline-none data-[focus]:ring-2 data-[focus]:ring-[#d85a30]/30 data-[focus]:ring-offset-1 data-[hover]:bg-[#c2edda]/25"
        aria-label={`Active applicant: ${display.primary}. Open to switch.`}
      >
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#c2edda] to-[#d85a30]/80 text-white text-xs font-bold flex items-center justify-center"
          aria-hidden
        >
          {display.initial}
        </span>
        <span className="min-w-0 flex flex-col items-start leading-tight text-left">
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
            Applicant
          </span>
          <span className="text-xs font-semibold text-gray-900 truncate w-full">
            {display.primary}
          </span>
          {display.secondary && (
            <span className="hidden sm:block text-[10px] text-gray-500 truncate w-full">
              {display.secondary}
            </span>
          )}
        </span>
        <FiChevronDown
          className="flex-shrink-0 text-gray-400 data-[open]:rotate-180 transition-transform"
          size={14}
          aria-hidden
        />
      </MenuButton>

      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 mt-2 w-72 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg p-1 focus:outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100"
      >
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Switch applicant
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Schemes and applications will use the member you select.
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {loadingMembers && members.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">Loading…</p>
          ) : members.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">
              No household members found.
            </p>
          ) : (
            members.map((m, idx) => {
              const id = resolveBeneficiaryPersonId(m);
              const selected =
                activeApplicantId && id && String(id) === String(activeApplicantId);
              const kycDone = isProfileKycFull(m);
              return (
                <MenuItem key={id || idx} disabled={!id}>
                  {({ focus }) => (
                    <button
                      type="button"
                      disabled={!id}
                      onClick={() => handleSelect(m)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg transition-colors ${
                        focus ? "bg-[#c2edda]/30" : ""
                      } ${selected ? "bg-[#c2edda]/20" : ""}`}
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-[#d85a30] text-sm font-bold flex items-center justify-center">
                        {memberInitial(m)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {memberFirstName(m)}
                          </span>
                          {m?.isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-white font-medium">
                              Primary
                            </span>
                          )}
                        </span>
                        {memberSubtitle(m) && !m?.isPrimary && (
                          <span className="text-xs text-gray-500 block truncate">
                            {memberSubtitle(m)}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-medium ${
                            kycDone ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          Profile KYC {kycDone ? "complete" : "incomplete"}
                        </span>
                      </span>
                      {selected && (
                        <FiCheck className="flex-shrink-0 text-[#d85a30]" size={18} aria-hidden />
                      )}
                    </button>
                  )}
                </MenuItem>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 p-1">
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={() => navigate("/user/household-members")}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#d85a30] rounded-lg ${
                  focus ? "bg-gray-50" : ""
                }`}
              >
                <FiUsers size={16} />
                Manage household
              </button>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}

import { useEffect, useState } from "react";
import {
  ACTIVE_APPLICANT_CHANGED_EVENT,
  getStoredActiveApplicantId,
} from "../utils/user.utils";

const ACTIVE_APPLICANT_ID_STORAGE_KEY = "activeApplicantId";

/**
 * Subscribes to active-beneficiary switches (same-tab event + cross-tab storage).
 * Use as a hook dependency so lists/profile refetch when the user taps "Select / Switch".
 */
export function useActiveApplicantId() {
  const [id, setId] = useState(() => getStoredActiveApplicantId());

  useEffect(() => {
    const sync = () => setId(getStoredActiveApplicantId());
    sync();
    window.addEventListener(ACTIVE_APPLICANT_CHANGED_EVENT, sync);
    const onStorage = (e) => {
      if (e.key === ACTIVE_APPLICANT_ID_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ACTIVE_APPLICANT_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return id;
}

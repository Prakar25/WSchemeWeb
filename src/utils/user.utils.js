export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const calculateAge = (dob) => {
  // dob format: DD-MM-YYYY
  const [day, month, year] = dob.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const formatDobForAge = (isoDate) => {
  if (!isoDate) return null;
  const dateObj = new Date(isoDate);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Check if user profile is complete (KYC Level is FULL)
 * @param {Object} user - User object from localStorage or API
 * @returns {boolean} - True if profile is complete
 */
export const isProfileComplete = (user) => {
  if (!user) return false;
  return user.kycLevel === "FULL";
};

/**
 * Get profile completion status message
 * @param {Object} user - User object from localStorage or API
 * @returns {Object} - { isComplete: boolean, message: string }
 */
export const getProfileCompletionStatus = (user) => {
  if (!user) {
    return {
      isComplete: false,
      message: "Please complete your profile to apply for schemes.",
    };
  }

  if (user.kycLevel === "FULL") {
    return {
      isComplete: true,
      message: "Your profile is complete.",
    };
  }

  return {
    isComplete: false,
    message: "Please complete your profile before applying for schemes.",
  };
};

/**
 * Get verification status (pending | verified | rejected)
 * Supports both user.verificationStatus and user.status?.verificationStatus
 */
export const getVerificationStatus = (user) => {
  if (!user) return null;
  return user.verificationStatus ?? user.status?.verificationStatus ?? null;
};

/**
 * Whether the user can apply to schemes (profile complete AND verified)
 */
export const canApplyToSchemes = (user) => {
  if (!user) return false;
  return isProfileComplete(user) && getVerificationStatus(user) === "verified";
};

/**
 * Message to show when account is not verified (exact text from backend)
 * When verified, backend sends null — don't show a banner.
 */
export const getAccountStatusMessage = (user) => {
  if (!user) return null;
  return user.accountStatusMessage ?? null;
};

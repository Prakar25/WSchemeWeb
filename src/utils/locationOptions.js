export const COUNTRIES = ["India"];

// App scope: only Sikkim is supported in dropdowns
export const INDIA_STATES = ["Sikkim"];

// District lists (only where we have a stable canonical list).
// Other states will show an empty district dropdown (user can’t free-type per requirement).
export const INDIA_DISTRICTS_BY_STATE = {
  Sikkim: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
};

export const getCountries = () => COUNTRIES.slice();

export const getStatesForCountry = (country) => {
  const c = String(country || "").trim();
  if (!c || c.toLowerCase() === "india") return INDIA_STATES.slice();
  return [];
};

export const getDistrictsForState = (state) => {
  const s = String(state || "").trim();
  return (INDIA_DISTRICTS_BY_STATE[s] || []).slice();
};

export const normalizeLocationValue = (v) => String(v || "").trim();


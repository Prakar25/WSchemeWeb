export function formatDateInDDMonYYYY(dateString) {
  const [year, month, day] = dateString.split("-");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedDate = `${parseInt(day)} ${
    months[parseInt(month) - 1]
  } ${parseInt(year)}`;
  return formattedDate;
}

export function formatTSWTZDate(dateString) {
  const date = new Date(dateString);

  const day = date.getUTCDate(); // Get the day
  const monthIndex = date.getUTCMonth(); // Get the month (0-based index)
  const year = date.getUTCFullYear(); // Get the year

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedDate = `${day} ${months[monthIndex]}, ${year}`;
  return formattedDate;
}

export const formatDateDDMMYYYY = (isoTimestamp) => {
  if (!isoTimestamp) return "";

  const date = new Date(isoTimestamp);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

// utils/date/formatDateForInput.js
export const formatDateForInput = (isoTimestamp) => {
  if (!isoTimestamp) return "";

  const date = new Date(isoTimestamp);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

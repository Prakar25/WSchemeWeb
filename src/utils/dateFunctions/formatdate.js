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

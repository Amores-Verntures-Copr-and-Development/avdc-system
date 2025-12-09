export const getDateToday = () => {
  const now = new Date();
  // Add 8 hours for Philippines time
  const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const dateToday = phTime.toISOString().slice(0, 19).replace("T", " ");
  return dateToday;
};

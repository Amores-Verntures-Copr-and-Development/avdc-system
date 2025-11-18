export const capitalizeWords = (str: string): string => {
  if (!str) return "";

  // Handle common abbreviations and special cases
  const specialCases: { [key: string]: string } = {
    and: "and",
    or: "or",
    the: "the",
    of: "of",
    in: "in",
    for: "for",
    kg: "kg",
    ml: "ml",
    lt: "lt",
  };

  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Don't capitalize articles and prepositions (except first word)
      if (index > 0 && specialCases[word]) {
        return specialCases[word];
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const formatMeetingDateTime = (timestamp?: number): string => {
  if (!timestamp) return "Not recorded";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "shortOffset",
  }).format(timestamp);
};

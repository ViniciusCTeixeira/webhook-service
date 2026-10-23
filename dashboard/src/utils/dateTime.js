export const formatTimestamp = (value) => {
  if (!value) return "";

  // SQLite timestamps are UTC but omit the timezone designator.
  const timestamp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return value;

  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return `${date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${time}.${String(date.getMilliseconds()).padStart(3, "0")}`;
};

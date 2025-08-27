export default function formatMessageTime(date) {
  if (date === "") return;
  if (isNaN(new Date(date))) return "";
  return new Date(date).toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hours12: false,
  });
}

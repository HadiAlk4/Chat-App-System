export function containsExternalLink(content) {
  return typeof content === "string" && /(https?:\/\/|www\.)/i.test(content);
}

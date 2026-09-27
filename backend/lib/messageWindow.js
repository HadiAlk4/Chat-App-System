export function latestMessagesOldestFirst(messages, limit = 5) {
  const newestFirst = [...messages].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
  return newestFirst.slice(0, limit).reverse();
}

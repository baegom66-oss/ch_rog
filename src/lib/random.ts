export function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick<T>(list: readonly T[]): T | undefined {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

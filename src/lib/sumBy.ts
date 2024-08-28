export const sumBy = <T extends unknown>(
  arr: Array<T>,
  func: (item: T) => number,
) => arr.reduce((acc, item) => acc + func(item), 0)

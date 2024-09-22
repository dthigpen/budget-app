/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function createCompareTo(keyGetter = (o) => o, reverse = false) {
  return function (s1, s2) {
    const k1 = keyGetter(s1);
    const k2 = keyGetter(s2);
    const flip = reverse ? -1 : 1;
    if (k1 < k2) {
      return flip * -1;
    } else if (k1 > k2) {
      return flip * 1;
    } else {
      return 0;
    }
  };
}

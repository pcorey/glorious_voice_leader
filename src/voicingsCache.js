const cache = {};

export const set = (key, value) => {
  cache[key] = value;
};

export const get = key => {
  return cache[key];
};

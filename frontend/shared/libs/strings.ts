export const capitalize = (str: string) => {
  return str
    .split(' ')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(' ');
};

export const makeQueryParams = (params: { [key: string]: string }): string => {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};

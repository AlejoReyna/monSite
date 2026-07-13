export const BASE_PATH = "";

export const withBasePath = (path: string) => {
  if (!BASE_PATH || !path.startsWith("/")) {
    return path;
  }

  return `${BASE_PATH}${path}`;
};

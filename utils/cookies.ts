export const getTokenFromCookie = (cookies: string[]) => {
  const tokenString = cookies[0].split(";")[0];
  const token = tokenString.split("=")[1];
  return token;
};

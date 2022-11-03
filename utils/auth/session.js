export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: process.env.SECRET_COOKIE_NAME,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

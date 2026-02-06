

export const rawBodyMiddleware = (req, res, buf) => {
  req.rawBody = buf;
};

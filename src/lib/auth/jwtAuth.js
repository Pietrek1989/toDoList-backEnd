import createHttpError from "http-errors";
import { verifyAccessToken } from "./jwtTokens.js";

export const jwtAuth = async (req, res, next) => {
  console.log("JWT Auth middleware triggered");
  if (!req.headers.authorization) {
    console.error("No bearer token provided.");
    next(createHttpError(401, "No bearer token provided. 🐻"));
  } else {
    const accessToken = req.headers.authorization.replace("Bearer ", "");
    // console.log("Access Token:", accessToken);
    try {
      const payload = await verifyAccessToken(accessToken);
      req.user = { _id: payload._id };
      next();
    } catch (error) {
      console.error("Error in jwtAuth middleware:", error.message);
      console.error(error.stack);
      next(createHttpError(401, "Invalid token."));
    }
  }
};

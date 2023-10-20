import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import UsersModel from "../../api/users/model.js";

export const createAccessToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) {
          console.error("Error creating access token:", err);
          reject(err);
        } else {
          // console.log("Access Token created:", token);
          resolve(token);
        }
      }
    )
  );

export const verifyAccessToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      // console.log("acc Token being verified:", token);

      if (err) {
        console.error("Error verifying access token:", err);
        reject(err);
      } else {
        // console.log("Access Token verified:", payload);
        resolve(payload);
      }
    })
  );

export const createRefreshToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET,
      { expiresIn: "360d" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyRefreshToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.REFRESH_SECRET, (err, payload) => {
      // console.log("ref Token being verified:", token);

      if (err) reject(err);
      else resolve(payload);
    })
  );

export const createTokens = async (user) => {
  // console.log(user);
  const accessToken = await createAccessToken({
    _id: user._id,
  });
  const refreshToken = await createRefreshToken({
    _id: user._id,
  });

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const verifyAndRefreshTokens = async (currentRefreshToken) => {
  try {
    // console.log("refreshToken", currentRefreshToken);
    const { _id } = await verifyRefreshToken(currentRefreshToken);
    const user = await UsersModel.findById(_id);
    // console.log("user", user);
    if (!user) throw new createHttpError(404, `User with id ${_id} not found.`);
    if (user.refreshToken && user.refreshToken === currentRefreshToken) {
      const { accessToken, refreshToken } = await createTokens(user);
      return { accessToken, refreshToken };
    } else {
      throw new createHttpError(401, "Invalid refresh token.");
    }
  } catch (error) {
    throw new createHttpError(401, "Please log in.");
  }
};

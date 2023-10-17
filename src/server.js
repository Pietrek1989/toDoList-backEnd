import Express from "express";
import cors from "cors";
import mongoose from "mongoose";
import {
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  genericErrorHandler,
  forbiddenErrorHandler,
} from "./errorhandlers.js";
import usersRouter from "./api/users/index.js";
import createHttpError from "http-errors";
import passport from "passport";
import { googleStrategy } from "./lib/auth/googleOAuth.js";
import listEndpoints from "express-list-endpoints";
import emailRouter from "./api/email/index.js";

// import filesRouter from "./api/images/files.js";
// import imagesRouter from "./api/images/index.js";

const server = Express();

const port = process.env.PORT || 3420;
const whitelist = [process.env.FE_URL, process.env.FE_PROD_URL];

passport.use("google", googleStrategy);

server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(400, `Origin ${currentOrigin} is not whitelisted.`)
        );
      }
    },
  })
);

server.use(Express.json());
server.use(passport.initialize());

server.use("/users", usersRouter);
// server.use("/images", imagesRouter);
// server.use("/files", filesRouter);
server.use("/email", emailRouter);
// try
server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(forbiddenErrorHandler);
server.use(notfoundHandler);
server.use(genericErrorHandler);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});

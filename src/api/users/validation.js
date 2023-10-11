import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const userSchema = {
  username: {
    in: ["body"],
    isString: {
      errorMessage: "Username is a mandatory field and needs to be a string!",
    },
  },
  email: {
    in: ["body"],
    isEmail: {
      errorMessage:
        "Email is a mandatory field and needs to be a valid email address!",
    },
  },
  password: {
    in: ["body"],
    isString: {
      errorMessage: "Password is a mandatory field and needs to be a string!",
    },
    isLength: {
      errorMessage: "Password should be at least 4 characters long!",
      options: { min: 4 },
    },
  },
};

export const checkUserSchema = checkSchema(userSchema);

export const triggerBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (errors.isEmpty()) {
    next();
  } else {
    next(
      createHttpError(400, "Errors during user validation", {
        errorsList: errors.array(),
      })
    );
  }
};

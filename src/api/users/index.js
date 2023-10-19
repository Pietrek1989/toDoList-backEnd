import express from "express";
import createError from "http-errors";
import UsersModel from "./model.js";
import {
  createAccessToken,
  createTokens,
  verifyAndRefreshTokens,
} from "../../lib/auth/jwtTokens.js";
import passport from "passport";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { checkUserSchema, triggerBadRequest } from "./validation.js";
import TaskModel from "../tasks/model.js";
import { v4 as uuidv4 } from "uuid";

const usersRouter = express.Router();

usersRouter.get(
  "/googlelogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

usersRouter.get(
  "/googlecallback",
  passport.authenticate("google", { session: false }),
  (req, res, next) => {
    try {
      res.redirect(
        `${process.env.FE_URL}/?accessToken=${req.user.accessToken}&refreshToken=${req.user.refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me/info", jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await UsersModel.findById(userId)
      .populate("tasks.todo")
      .populate("tasks.doing")
      .populate("tasks.done");

    res.send(user);
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me/info", jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    const user = await UsersModel.findById(userId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    for (let key in updates) {
      if (user[key] !== undefined) {
        // only allow updating existing fields
        user[key] = updates[key];
      }
    }

    await user.save();

    res.send({ message: "User data updated successfully" });
  } catch (error) {
    console.error(error);

    next(error);
  }
});
usersRouter.put("/me/tasks", jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { tasks } = req.body;
    console.log("Incoming tasks data:", req.body.tasks);
    const mapTasks = async (taskArray) => {
      return await Promise.all(
        taskArray.map(async (task) => {
          if (task._id) {
            // Existing task, update it
            const updatedTask = await TaskModel.findByIdAndUpdate(
              task._id,
              task,
              { new: true, upsert: false, runValidators: true }
            ).lean();

            return updatedTask._id;
          } else {
            // New task, create a new task
            const newTask = new TaskModel(task);
            await newTask.save();
            return newTask._id;
          }
        })
      );
    };

    const updatedTasks = {
      todo: await mapTasks(tasks.todo),
      doing: await mapTasks(tasks.doing),
      done: await mapTasks(tasks.done),
    };

    const user = await UsersModel.findOneAndUpdate(
      { _id: userId },
      { tasks: updatedTasks },
      { new: true, upsert: false, runValidators: true }
    );

    if (!user) {
      return next(createError(404, "User not found"));
    }

    const populatedUser = await user.populate([
      { path: "tasks.todo" },
      { path: "tasks.doing" },
      { path: "tasks.done" },
    ]);
    console.log("Updated task data:", populatedUser.tasks);
    res.send({
      message: "Tasks updated successfully",
      tasks: user.tasks,
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me/tasks/:taskId", jwtAuth, async (req, res) => {
  try {
    const user = await UsersModel.findById(req.user._id).populate(
      "tasks.todo tasks.doing tasks.done"
    );
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const { taskId } = req.params;
    const taskData = req.body;

    const findTaskAndColumn = () => {
      for (let column of ["todo", "doing", "done"]) {
        const index = user.tasks[column].findIndex(
          (task) => task._id.toString() === taskId
        );
        if (index !== -1) {
          return { column, index };
        }
      }
      return null;
    };

    const taskInfo = findTaskAndColumn();
    if (!taskInfo) {
      return res.status(404).send({ message: "Task not found" });
    }

    // Refetch the user and task to ensure we have the latest version
    const freshUser = await UsersModel.findById(req.user._id).populate(
      "tasks.todo tasks.doing tasks.done"
    );
    const freshTask = freshUser.tasks[taskInfo.column][taskInfo.index];

    Object.assign(freshTask, taskData);
    await freshTask.save();

    res.send({ message: "Task updated successfully", task: freshTask });
  } catch (error) {
    console.error("Error in PUT /me/tasks/:taskId:", error);
    res.status(500).send({ message: "Server error, we will fix it asap" });
  }
});

usersRouter.post(
  "/account",
  checkUserSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const existingUser = await UsersModel.findOne({ email });
      if (existingUser) {
        return next(createError(400, "Email already in use"));
      }

      const newUser = await UsersModel.create(req.body);
      await newUser.save();

      res.send({ newUser });
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post("/session", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UsersModel.checkCredentials(email, password);
    if (user) {
      const { accessToken, refreshToken } = await createTokens(user);
      res.send({ accessToken, refreshToken });
    } else {
      next(createError(401, "Invalid credentials"));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/session", jwtAuth, async (req, res, next) => {
  try {
    const user = await UsersModel.findByIdAndUpdate(
      req.user._id,
      {
        refreshToken: "",
      },
      { new: true }
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/session/refresh", jwtAuth, async (req, res, next) => {
  try {
    const { currentRefreshToken } = req.body;
    const { accessToken, refreshToken } = await verifyAndRefreshTokens(
      currentRefreshToken
    );
    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:userId", jwtAuth, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);
    if (user) {
      res.send(user);
    } else {
      next(createError(404, `User with id ${req.params.userId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/:userId", jwtAuth, async (req, res, next) => {
  await user.save();
  try {
    const userId = req.params.userId;
    const updates = req.body; // Assume that updates are sent in the body of the request

    const user = await UsersModel.findById(userId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    for (let key in updates) {
      if (user[key] !== undefined) {
        // only allow updating existing fields
        user[key] = updates[key];
      }
    }
    await user.save();

    res.send({
      message: "User data updated successfully",
      updatedUser: user,
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/password-reset-request", async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await UsersModel.findOne({ email });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    const resetToken = uuidv4();
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    // Send email to user with reset link
    // e.g., `https://yourapp.com/reset-password?token=${resetToken}`
    // ...

    res.send({ message: "Reset link sent to email" });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/password-reset", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await UsersModel.findOne({ resetToken: token });

    if (!user || user.resetTokenExpiration < Date.now()) {
      return next(createError(400, "Invalid or expired reset token"));
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.send({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
});

export default usersRouter;

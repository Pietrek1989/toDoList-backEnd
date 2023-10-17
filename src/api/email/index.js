import express from "express";
import SibApiV3Sdk from "sib-api-v3-sdk";
import createError from "http-errors";
import bcrypt from "bcrypt";
import UsersModel from "../users/model.js";

const emailRouter = express.Router();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

emailRouter.post("/forgot-password", async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await UsersModel.findOne({ email });
    if (!user) {
      return next(createError.NotFound("User not found"));
    }

    const resetToken = await bcrypt.genSalt(16);
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    const resetURL = `${process.env.FE_URL}/reset-password/${resetToken}`;
    const sendSmtpEmail = {
      to: [{ email }],
      sender: {
        email: process.env.SENDER_EMAIL_ADRESS,
        name: "Your App Name",
      },
      subject: "Password Reset Request",
      htmlContent: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click <a href="${resetURL}">here</a> to reset your password.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
      replyTo: { email: process.env.SENDER_EMAIL_ADRESS },
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.status(200).send("Password reset email sent successfully");
  } catch (error) {
    console.error(error);
    next(
      new createError.InternalServerError(
        "Error processing password reset request"
      )
    );
  }
});

emailRouter.post("/reset-password/:token", async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await UsersModel.findOne({
      resetToken: token,
      resetTokenExpiration: { $gte: Date.now() },
    });

    if (!user) {
      return next(createError.BadRequest("Invalid or expired reset token"));
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).send("Password reset successful");
  } catch (error) {
    console.error(error);
    next(new createError.InternalServerError("Error resetting password"));
  }
});

export default emailRouter;

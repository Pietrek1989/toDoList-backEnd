import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const UsersSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dvagn6szo/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1697119285/profile-728591_640_iqw8jv.jpg",
    },
    tasks: {
      todo: [{ type: Schema.Types.ObjectId, ref: "Task" }],
      doing: [{ type: Schema.Types.ObjectId, ref: "Task" }],
      done: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    },

    refreshToken: { type: String },
    googleId: { type: String },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiration: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UsersSchema.pre("save", async function () {
  const newUserData = this;
  if (newUserData.isModified("password")) {
    const plainPw = newUserData.password;
    const hash = await bcrypt.hash(plainPw, 16);
    newUserData.password = hash;
  }
});

UsersSchema.pre("findOneAndUpdate", async function () {
  const update = { ...this.getUpdate() };
  if (update.password) {
    const plainPw = update.password;
    const hash = await bcrypt.hash(plainPw, 16);
    update.password = hash;
    this.setUpdate(update);
  }
});

UsersSchema.methods.toJSON = function () {
  const current = this.toObject();
  delete current.password;
  delete current.createdAt;
  delete current.updatedAt;
  delete current.__v;

  return current;
};

UsersSchema.static("checkCredentials", async function (email, plainPw) {
  const user = await this.findOne({ email });
  if (user) {
    const match = await bcrypt.compare(plainPw, user.password);
    if (match) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model("User", UsersSchema);

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  username: string;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;

  passwordLastUpdatedAt?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;

  lemonSqueezyCustomerId?: string | null;
  lemonSqueezySubscriptionId?: string | null;
  lemonSqueezyVariantId?: string | null;
  lemonSqueezyRenewsAt?: Date | null;

  subscriptionStatus?: "active" | "canceled" | "past_due" | "unpaid" | "free" | "on_trial" | "expired" | "paused";

  pendingEmail?: string | null;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpires?: Date | null;

  authProvider?: "google" | "github" | "credentials" | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [100, "Email cannot exceed 100 characters"],
      match: [/.+\@.+\..+/, "Please provide a valid email address"],
    },

    emailVerified: { type: Date },

    image: { type: String, default: null },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    password: {
      type: String,
      default: null,
    },

    passwordLastUpdatedAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    lemonSqueezyCustomerId: { type: String, default: null },
    lemonSqueezySubscriptionId: { type: String, default: null },
    lemonSqueezyVariantId: { type: String, default: null },
    lemonSqueezyRenewsAt: { type: Date, default: null },

    subscriptionStatus: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "free", "on_trial", "expired", "paused"],
      default: "free",
    },

    pendingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpires: { type: Date, default: null },

    authProvider: {
      type: String,
      enum: ["google", "github", "credentials", null],
      default: null,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
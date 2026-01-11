import mongoose, { Schema, Document, Model, models } from "mongoose";

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

  stripeCustomerId?: string | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "unpaid" | "free";
  subscriptionPriceId?: string | null;

  pendingEmail?: string | null;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpires?: Date | null;

  onboardingCompleted?: boolean;
  persona?: string | null;
  goals?: string[];
  workStyle?: string | null;
  challenge?: string | null;
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

    stripeCustomerId: { type: String, default: null },
    subscriptionStatus: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "free"],
      default: "free",
    },
    subscriptionPriceId: { type: String, default: null },

    pendingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpires: { type: Date, default: null },

    onboardingCompleted: { type: Boolean, default: false },
    persona: { type: String, default: null },
    goals: { type: [String], default: [] },
    workStyle: { type: String, default: null },
    challenge: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["google", "github", "credentials", null],
      default: null,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
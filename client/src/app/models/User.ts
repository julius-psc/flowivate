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

  // Stripe fields:
  stripeCustomerId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "unpaid" | "free";
  subscriptionPriceId?: string;
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
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    emailVerified: { type: Date },
    image: { type: String },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    password: {
      type: String,
    },
    // Stripe fields
    stripeCustomerId: { type: String, default: null },
    subscriptionStatus: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "free"],
      default: "free",
    },
    subscriptionPriceId: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
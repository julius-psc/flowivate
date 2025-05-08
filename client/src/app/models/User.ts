import mongoose, { Schema, Document, Model, models } from 'mongoose';

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
  },
  {
    timestamps: true,
  }
);


const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
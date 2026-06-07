import mongoose, { Schema, Document } from "mongoose";

export interface IUserDoc extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  subscription: "free" | "premium";
  createdAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    subscription: { type: String, enum: ["free", "premium"], default: "free" },
  },
  { timestamps: true }
);

// Prevent model recompilation in dev (hot reload)
export default mongoose.models.User as mongoose.Model<IUserDoc> ||
  mongoose.model<IUserDoc>("User", UserSchema);

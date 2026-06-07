import mongoose, { Schema, Document } from "mongoose";

export interface IBlockedAppDoc extends Document {
  userId: mongoose.Types.ObjectId;
  appName: string;
  executableName: string;
  enabled: boolean;
}

const BlockedApplicationSchema = new Schema<IBlockedAppDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appName: { type: String, required: true },
    executableName: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.BlockedApplication as mongoose.Model<IBlockedAppDoc> ||
  mongoose.model<IBlockedAppDoc>("BlockedApplication", BlockedApplicationSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface ISessionConfigDoc extends Document {
  userId: mongoose.Types.ObjectId;
  mode: "pomodoro" | "deep_work" | "custom";
  sessionDuration: number;
  objective: string;
  createdAt: Date;
}

const SessionConfigSchema = new Schema<ISessionConfigDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, enum: ["pomodoro", "deep_work", "custom"], required: true },
    sessionDuration: { type: Number, required: true, min: 1 },
    objective: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.SessionConfig as mongoose.Model<ISessionConfigDoc> ||
  mongoose.model<ISessionConfigDoc>("SessionConfig", SessionConfigSchema);

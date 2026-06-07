import mongoose, { Schema, Document } from "mongoose";

export interface IStudySessionDoc extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  mode: "pomodoro" | "deep_work" | "custom";
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "completed_early" | "cancelled";
  focusScore: number;
  distractions: {
    phone: number;
    tab: number;
    face: number;
    people: number;
    posture: number;
    gaze: number;
  };
  durationSeconds: number;
  distractedSeconds: number;
  productivityGrade?: string;
  objective: string;
}

const StudySessionSchema = new Schema<IStudySessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, default: "Focus Session" },
    mode: { type: String, enum: ["pomodoro", "deep_work", "custom"], required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "completed_early", "cancelled"],
      default: "active",
    },
    focusScore: { type: Number, default: 100, min: 0, max: 100 },
    distractions: {
      phone: { type: Number, default: 0 },
      tab: { type: Number, default: 0 },
      face: { type: Number, default: 0 },
      people: { type: Number, default: 0 },
      posture: { type: Number, default: 0 },
      gaze: { type: Number, default: 0 },
    },
    durationSeconds: { type: Number, default: 0 },
    distractedSeconds: { type: Number, default: 0 },
    productivityGrade: { type: String },
    objective: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.StudySession as mongoose.Model<IStudySessionDoc> ||
  mongoose.model<IStudySessionDoc>("StudySession", StudySessionSchema);

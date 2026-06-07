import mongoose, { Schema, Document } from "mongoose";

export interface IFocusMetricsDoc extends Document {
  sessionId: mongoose.Types.ObjectId;
  focusScore: number;
  studyTime: number;
  distractedTime: number;
  distractionFreePercentage: number;
  productivityStatus: "High" | "Optimal" | "Distracted";
  goalProgress: number;
  updatedAt: Date;
}

const FocusMetricsSchema = new Schema<IFocusMetricsDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "StudySession", required: true, index: true },
    focusScore: { type: Number, default: 100, min: 0, max: 100 },
    studyTime: { type: Number, default: 0 },
    distractedTime: { type: Number, default: 0 },
    distractionFreePercentage: { type: Number, default: 100 },
    productivityStatus: { type: String, enum: ["High", "Optimal", "Distracted"], default: "High" },
    goalProgress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.models.FocusMetrics as mongoose.Model<IFocusMetricsDoc> ||
  mongoose.model<IFocusMetricsDoc>("FocusMetrics", FocusMetricsSchema);

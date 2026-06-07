import mongoose, { Schema, Document } from "mongoose";

export interface IViolationDoc extends Document {
  sessionId: mongoose.Types.ObjectId;
  violationType: string;
  source: string;
  timestamp: Date;
}

const ViolationSchema = new Schema<IViolationDoc>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "StudySession", required: true, index: true },
    violationType: { type: String, required: true },
    source: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }
);

export default mongoose.models.Violation as mongoose.Model<IViolationDoc> ||
  mongoose.model<IViolationDoc>("Violation", ViolationSchema);

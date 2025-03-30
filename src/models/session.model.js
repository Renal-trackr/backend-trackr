import { model, Schema } from "mongoose";

const SessionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  user_agent: { type: String },
  ip_address: { type: String },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Index for faster querying and automatic expiration
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Session = model("Session", SessionSchema);

export default Session;

import {model, Schema} from "mongoose";

const ActionHistorySchema = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
    action_type: {type: String, required: true},  // Changed from type_action 
    description: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
});

const ActionHistory = model("ActionHistory", ActionHistorySchema);

export default ActionHistory;

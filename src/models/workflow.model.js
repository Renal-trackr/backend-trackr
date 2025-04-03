import {model, Schema} from "mongoose";

const WorkflowSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patients_ids: [{
        type: Schema.Types.ObjectId,
        ref: "Patient"
    }],
    is_template: { type: Boolean, default: false },
    steps: [{
        type: Schema.Types.ObjectId,
        ref: "WorkflowStep"
    }],
    status: {
        type: String,
        enum: ["active", "completed", "paused", "inactive", "error"],
        default: "inactive"
    },
    current_step_index: { type: Number, default: 0 },
    parallel_execution: { type: Boolean, default: false },
    metadata: {
        created_by: { type: Schema.Types.ObjectId, ref: "User" },
        last_modified_by: { type: Schema.Types.ObjectId, ref: "User" },
        version: { type: Number, default: 1 }
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
const Workflow = model("Workflow", WorkflowSchema);

export default Workflow;
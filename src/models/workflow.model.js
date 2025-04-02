import {model, Schema} from "mongoose";

const WorkflowSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    doctor_id: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patients_ids: [{ type: Schema.Types.ObjectId, ref: "Patient" }], // Array of patient IDs
    is_template: { type: Boolean, default: false }, // Flag to mark as a template
    steps: [{ type: Schema.Types.ObjectId, ref: "WorkflowStep" }],
    status: { type: String, enum: ["active", "completed", "paused"], default: "active" },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const Workflow = model("Workflow", WorkflowSchema);

export default Workflow;
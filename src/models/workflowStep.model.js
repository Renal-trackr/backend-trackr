import { model, Schema } from "mongoose";

const WorkflowStepSchema = new Schema({
    workflow_id: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },

    type: { type: String, enum: ["reminder", "task", "alert", "appointment", "analysis_test"], required: true },
    condition: { 
        type: Schema.Types.Mixed,

    },
    action: { 
        type: Schema.Types.Mixed,

    },
    status: { type: String, enum: ["pending", "completed", "failed", "skipped"], default: "pending" },
    result: { type: Schema.Types.Mixed }, 
    dependencies: [{ type: Schema.Types.ObjectId, ref: "WorkflowStep" }], 
    next_steps: {
        type: Map,
        of: { type: Schema.Types.ObjectId, ref: "WorkflowStep" }

    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const WorkflowStep = model("WorkflowStep", WorkflowStepSchema);

export default WorkflowStep;

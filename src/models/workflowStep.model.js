import { model, Schema } from "mongoose";

const WorkflowStepSchema = new Schema({
    workflow_id: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    // Expanded type options to include analysis_test
    type: { type: String, enum: ["reminder", "task", "alert", "appointment", "analysis_test"], required: true },
    condition: { 
        type: Schema.Types.Mixed,
        // Condition can include:
        // - timing: when to execute the step
        // - parameter: which parameter to evaluate
        // - operator: comparison operator (>, <, =, etc.)
        // - value: threshold value for the condition
        // - next_steps: mapping of possible outcomes to next step IDs
    },
    action: { 
        type: Schema.Types.Mixed,
        // Action can include:
        // - action_type: notification, create_appointment, run_test, etc.
        // - details: specific to the action type
    },
    status: { type: String, enum: ["pending", "completed", "failed", "skipped"], default: "pending" },
    result: { type: Schema.Types.Mixed }, // Store results of tests or other operations
    dependencies: [{ type: Schema.Types.ObjectId, ref: "WorkflowStep" }], // Steps that must be completed first
    next_steps: {
        type: Map,
        of: { type: Schema.Types.ObjectId, ref: "WorkflowStep" }
        // Maps outcomes to next steps (e.g., "normal" -> step1, "abnormal" -> step2)
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const WorkflowStep = model("WorkflowStep", WorkflowStepSchema);

export default WorkflowStep;

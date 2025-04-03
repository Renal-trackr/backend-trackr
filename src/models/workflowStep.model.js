import { model, Schema } from "mongoose";

const WorkflowStepSchema = new Schema({
    workflow_id: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    type: {
        type: String,
        enum: ["reminder", "task", "alert", "appointment", "analysis_test"],
        required: true
    },
    condition: {
        type: {
            type: String,
            enum: ["time_based", "parameter_based", "event_based", "none"],
            default: "none"
        },
        parameters: {
            parameter_name: String,
            operator: String,
            threshold_value: Schema.Types.Mixed
        },
        time_condition: {
            after_previous_step: Number, // heures
            specific_time: Date
        },
        next_steps: {
            on_success: { type: Schema.Types.ObjectId, ref: "WorkflowStep" },
            on_failure: { type: Schema.Types.ObjectId, ref: "WorkflowStep" }
        }
    },
    action: {
        type: {
            type: String,
            required: true,
            enum: ["notification", "create_appointment", "request_test", "send_alert"]
        },
        target: {
            type: String,
            enum: ["patient", "doctor", "both", "system"],
            required: true
        },
        message_template: String,
        appointment_details: {
            duration: Number,
            type: String
        },
        test_details: {
            test_type: String,
            required_values: [String]
        }
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "skipped", "waiting_condition"],
        default: "pending"
    },
    execution_logs: [{
        timestamp: Date,
        status: String,
        message: String,
        details: Schema.Types.Mixed
    }],
    dependencies: [{
        type: Schema.Types.ObjectId,
        ref: "WorkflowStep"
    }],
    schedule: {
        type: {
            type: String,
            enum: ["once", "daily", "weekly", "monthly", "custom"]
        },
        start_date: { type: Date },
        end_date: { type: Date },
        interval: { type: Number },
        cron_expression: { type: String },
        last_executed: { type: Date }
    },
    is_parallelizable: { type: Boolean, default: false }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
const WorkflowStep = model("WorkflowStep", WorkflowStepSchema);

export default WorkflowStep;

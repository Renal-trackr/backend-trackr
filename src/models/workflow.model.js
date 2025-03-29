import {model, Schema} from "mongoose";

const WorkflowSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    doctor_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
    steps: [{type: Schema.Types.Mixed}],
    created_at: {type: Date, default: Date.now},
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const Workflow = model("Workflow", WorkflowSchema);

export default Workflow
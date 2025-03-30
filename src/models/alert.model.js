import {model, Schema} from "mongoose";

const AlertSchema = new Schema({
    patient_id: {type: Schema.Types.ObjectId, ref: "Patient", required: true},
    alert_type: {type: String, required: true},
    message: {type: String, required: true},
    status: {type: String, enum: ["Nouveau", "En cours", "Résolu"], default: "Nouveau"},
    created_at: {type: Date, default: Date.now},
    analysis_id: {type: Schema.Types.ObjectId, ref: "MedicalAnalysis"},
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const Alert = model("Alert", AlertSchema);

export default Alert;

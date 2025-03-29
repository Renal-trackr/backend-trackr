import {model, Schema} from "mongoose";

const MedicalAnalysisSchema = new Schema({
    patient_id: {type: Schema.Types.ObjectId, ref: "Patient", required: true},
    doctor_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
    date_analyse: {type: Date, required: true},
    results: {type: Schema.Types.Mixed, required: true},
    interpretation: {type: String},
    alert_generated: {type: Boolean, default: false},
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const MedicalAnalysis = model("MedicalAnalysis", MedicalAnalysisSchema)

export default MedicalAnalysis;
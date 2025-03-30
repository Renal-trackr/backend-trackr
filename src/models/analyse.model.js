import {model, Schema} from "mongoose";

const MedicalAnalysisSchema = new Schema({
    patient_id: {type: Schema.Types.ObjectId, ref: "Patient", required: true},
    doctor_id: {type: Schema.Types.ObjectId, ref: "Doctor", required: true},
    analysis_date: {type: Date, required: true},  // Changed from date_analyse
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
import {model, Schema} from "mongoose";

const PatientSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    birth_date: { type: Date, required: true },
    gender: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    blood_group: { type: String, required: true },
    mrc_status: { type: String, required: true },
    current_treatments: [{ type: String }],
    medical_history: [Schema.Types.Mixed],
    appointment_ids: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    antecedents: [Schema.Types.Mixed ],
    doctor_ref: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const Patient = model("Patient", PatientSchema);

export default Patient;
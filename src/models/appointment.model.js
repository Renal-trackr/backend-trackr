import {model, Schema} from "mongoose";

const AppointmentSchema = new Schema({
    patient_id: {type: Schema.Types.ObjectId, ref: "Patient", required: true},
    doctor_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
    appointment_date: {type: Date, required: true},
    motif: {type: String, required: true},
    status: {type: String, default: "À venir"},
    notes: {type: String}
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const Appointment = model("Appointment", AppointmentSchema);

export default Appointment;
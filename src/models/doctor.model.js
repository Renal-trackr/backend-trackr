import {model, Schema} from "mongoose";

const DoctorSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    speciality: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    workflows_ids: [{ type: Schema.Types.ObjectId, ref: "Workflow" }],
    monitored_patients: [{ type: Schema.Types.ObjectId, ref: "Patient" }],
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const Doctor = model("Doctor", DoctorSchema);

export default Doctor;
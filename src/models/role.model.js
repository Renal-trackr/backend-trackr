import {model, Schema} from "mongoose";
import {v4 as uuidv4} from "uuid";

const RoleSchema = new Schema({
    _id: {type: String, default: uuidv4},
    name: {
        type: String,
        enum: ["ADMIN", "MEDECIN"],
        required: true,
        unique: true,
    },
});

const Role = model("Role", RoleSchema)

export default Role;
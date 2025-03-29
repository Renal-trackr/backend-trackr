import {model, Schema} from "mongoose";

const UserSchema = new Schema({
    firstname: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role_id: {type: String, ref: "Role", required: true},
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const User = model("User", UserSchema);

export default User;
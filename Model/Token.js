
import mongoose from "mongoose";
const { Schema } = mongoose;

const tokenSchema = new Schema({
    locationId: { type: String, required: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
  });
  
  const Token = mongoose.model("Token", tokenSchema);

  export default Token;
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    crm: {
      type: String,
      default: "",
    },

    crmUf: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
    },

    cfmVerifiedAt: {
      type: Date,
      default: null,
    },

    specialty: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Doctor", doctorSchema);

import mongoose, { model, Schema } from "mongoose";

const logoSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true
    },
    rows: {
        type: Number,
        required: true
    },
    cols: {
        type: Number,
        required: true
    },
    pixels : [{
        pixelNumber:{
            type: Number,
            required: true
        },
        smallImage:{
            type: String,
            required: true
        },
    }],
    logoLink:{
        type: String,
        required: true
    },
},{
    timestamps: true
});

const Logo = mongoose.models.Logo || model('Logo', logoSchema);
export default Logo;
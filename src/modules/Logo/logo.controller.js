import Logo from "../../../DB/models/logo.model.js";
import axios from "axios";
import { systemRoles } from "../../utils/system-roles.js";
//&====================== ADD LOGO ======================&//
export const addLogo = async (req, res, next) => {
  const { username, email, title, description, rows, cols, logoLink, selectedCells } = req.body;
  let pixels = selectedCells.map((cell) => ({
    pixelNumber: cell.cellId,
    smallImage: cell.canvasData,
  }));
  //* search if any pixel of logo is repeated on any verified logo in the database
  const logos = await Logo.find({isVerified: true});
  if (!logos) {
    return res.status(400).json({ message: "Failed to fetch logos" });
  }
  // for (let i = 0; i < logos.length; i++) {
  //   const logo = logos[i];
  //   for (let j = 0; j < logo.pixels.length; j++) {
  //     const pixel = logo.pixels[j];
  //     for (let k = 0; k < pixels.length; k++) {
  //       const newPixel = pixels[k];
  //       if (pixel.pixelNumber == newPixel.pixelNumber) {
  //         console.log("Pixel is already taken", pixel.pixelNumber);
  //         return res.status(400).json({ message: "Pixel is already taken" });
  //       }
  //     }
  //   }
  // }
  const price = rows * cols * 20;
  //* Create a new logo document with isVerified initially false
  const logo = await Logo.create({
    username, 
    email,
    title,
    description,
    image: req.file.path,
    rows,
    cols,
    pixels,
    logoLink
  });
  if(rows * cols != selectedCells.length){
    return res.status(400).json({ message: "Failed to add logo" });
  }

  if (!logo) {
    return res.status(400).json({ message: "Failed to add logo" });
  }

  try {
    const tapResponse = await axios.post(
      `${process.env.TAP_URL}/charges`,
      {
        amount: price,
        currency: "SAR",
        threeDSecure: false,
        save_card: false,
        description: `Payment for logo: ${title}`,
        statement_descriptor: "LOGO-PAY",
        metadata: { logoId: logo._id },
        reference: {
          transaction: `logo_${logo._id}`,
          order: `order_${logo._id}`,
        },
        receipt: {
          email: true,
          sms: true,
        },
        customer: {
          first_name: username,
          email:  email,
        },
        source: {
          id: "src_card",
        },
        post: {url: `${process.env.NGROK_URL}/logo/webhook`},
        redirect: {
          url: `http://localhost:5173?logoId=${logo._id}`,
        },
      },
      {
        headers: {
          Authorization: `${process.env.TAP_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const paymentLink = tapResponse.data.transaction.url;

    return res.status(201).json({
      message: "Logo added successfully. Proceed to payment.",
      paymentLink,
    });
  } catch (error) {
    console.error("Payment error:", error.response?.data || error.message);
    return res.status(500).json({ message: "Failed to create payment link" });
  }
};

//&====================== ADD UNPAID LOGO ======================&//
export const addUnpaidLogo = async (req, res, next) => {
  const { username, email, title, description, rows, cols, logoLink, selectedCells } = req.body;
  let pixels = selectedCells.map((cell) => ({
    pixelNumber: cell.cellId,
    smallImage: cell.canvasData,
  }));
  //* search if any pixel of logo is repeated on any verified logo in the database
  const logos = await Logo.find({isVerified: true});
  if (!logos) {
    return res.status(400).json({ message: "Failed to fetch logos" });
  }
  for (let i = 0; i < logos.length; i++) {
    const logo = logos[i];
    for (let j = 0; j < logo.pixels.length; j++) {
      const pixel = logo.pixels[j];
      for (let k = 0; k < pixels.length; k++) {
        const newPixel = pixels[k];
        if (pixel.pixelNumber == newPixel.pixelNumber) {
          console.log("Pixel is already taken", pixel.pixelNumber);
          return res.status(400).json({ message: "Pixel is already taken" });
        }
      }
    }
  }
  //* Create a new logo document with isVerified initially false
  const logo = await Logo.create({
    username, 
    email,
    title,
    description,
    image: req.file.path,
    rows,
    cols,
    pixels,
    logoLink,
    isVerified: true
  });
  if(rows * cols != selectedCells.length){
    return res.status(400).json({ message: "Failed to add logo" });
  }

  if (!logo) {
    return res.status(400).json({ message: "Failed to add logo" });
  }
  //* return the logo
  return res.status(201).json({ message: "Logo added successfully", logo });
};

//&====================== UPDATE LOGO ======================&//
export const updateLogo = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  const {role} = req.authUser;
  const { username, email, title, description, rows, cols, logoLink, selectedCells } = req.body;
  console.log(selectedCells);

  //* check if the user is not an admin
  if (role !== systemRoles.ADMIN) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  //* check if the logo exists and verified
  const logoExist = await Logo.findById(id);
  if (!logoExist) {
    return res.status(404).json({ message: "Logo not found" });
  }
  //* check what is updated
  if (username) logoExist.username = username;
  if (email) logoExist.email = email;
  if (title) logoExist.title = title;
  if (description) logoExist.description = description;
  if (req.file) logoExist.image = req.file.path;
  if (rows || cols) {
    logoExist.rows = rows;
    logoExist.cols = cols;
    //* check if the number of pixels is equal to the number of rows and cols
    if (selectedCells && selectedCells?.length != rows * cols) {
      return res.status(400).json({ message: "Number of pixels is not equal to the number of rows and cols" });
    }
  }
  if (logoLink) logoExist.logoLink = logoLink;

  let pixels ;
  if(selectedCells){
    const logos = await Logo.find({isVerified: true});
    if (!logos) {
      return res.status(400).json({ message: "Failed to fetch logos" });
    }
    pixels = selectedCells?.map((cell) => ({
      pixelNumber: cell.cellId,
      smallImage: cell.canvasData,
    }));
    for (let i = 0; i < logos.length; i++) {
      const logo = logos[i];
      for (let j = 0; j < logo.pixels.length; j++) {
        const pixel = logo.pixels[j];
        for (let k = 0; k < pixels.length; k++) {
          const newPixel = pixels[k];
          if (pixel.pixelNumber == newPixel.pixelNumber && logo._id != id) {
            console.log("Pixel is already taken", pixel.pixelNumber);
            return res.status(400).json({ message: "Pixel is already taken" });
          }
        }
      }
    }
    logoExist.pixels = pixels;
  }
  if(!logoExist.isVerified){
    return res.status(400).json({ message: "Logo is not verified" });
  }
  //* search if any pixel of logo is repeated on any verified logo in the database
  const logo = await logoExist.save();
  if (!logo) {
    return res.status(404).json({ message: "Logo not found" });
  }
  return res.status(200).json({ message: "Logo updated successfully", logo, success: true });
};
//&====================== WEBHOOK ======================&//
export const verifyPayment = async (req, res) => {
  const { id, metadata } = req.body;
  const logoId = metadata.logoId;
  console.log("tap_id", logoId);

const options = {
  method: 'GET',
  url: `${process.env.TAP_URL}/charges/${id}`,
  headers: {
    accept: 'application/json',
    Authorization:  `${process.env.TAP_SECRET_KEY}`
  }
};
const response = await axios.request(options)
let logo;
if (response.data.status === 'CAPTURED') {
  logo = await Logo.findByIdAndUpdate(
    logoId,
    { isVerified: true },
    { new: true }
  );  
}
  if (!logo) {
    return res.status(404).json({ message: "Logo not found" });
  }
  return res.status(200).json({ message: "Payment verified and logo updated", logo });
};

//&====================== GET LOGOS ======================&//
export const getLogos = async (req, res, next) => {
  const logos = await Logo.find({isVerified: true});
  if (!logos) {
    return res.status(400).json({ message: "Failed to fetch logos" });
  }
  return res.status(200).json({ logos });
};

//&====================== DELETE LOGO ======================&//
export const deleteLogo = async (req, res, next) => {
  const { id } = req.params;
  const logo = await Logo.findByIdAndDelete(id);
  if (!logo) {
    return res.status(404).json({ message: "Logo not found" });
  }
  return res.status(200).json({ message: "Logo deleted successfully", success: true });
};
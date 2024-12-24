import Logo from "../../../DB/models/logo.model.js";
import axios from "axios";
//&====================== ADD LOGO ======================&//
export const addLogo = async (req, res, next) => {
  const { title, description, rows, cols, logoLink, selectedCells } = req.body;

  let pixels = selectedCells.map((cell) => ({
    pixelNumber: cell.cellId,
    smallImage: cell.canvasData,
  }));

  // Calculate price
  const price = rows * cols * 10;

  // Create a new logo document with isVerified initially false
  const logo = await Logo.create({
    title,
    description,
    image: "s",
    rows,
    cols,
    pixels,
    logoLink,
    isVerified: false,
  });
  if(rows * cols != selectedCells.length){
    return res.status(400).json({ message: "Failed to add logo" });
  }

  if (!logo) {
    return res.status(400).json({ message: "Failed to add logo" });
  }

  // Generate Tap Payments charge
  try {
    const tapResponse = await axios.post(
      "https://api.tap.company/v2/charges",
      {
        amount: price,
        currency: "KWD",
        threeDSecure: true,
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
          first_name: "Customer",
          email:  "example@example.com",
        },
        source: {
          id: "src_card", // This specifies that the source is a card
        },
        post: {url: 'https://5a6b-41-233-39-196.ngrok-free.app/logo/webhook'},
        redirect: {
          url: `http://localhost:5173?logoId=${logo._id}`,
        },
      },
      {
        headers: {
          Authorization: `${process.env.TAP_SECRET_KEY}`, // Replace with your Tap Secret Key
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

// Verify Payment and Flip isVerified to True
export const verifyPayment = async (req, res) => {
  // console.log("tap_idjjj");
  const { id, metadata } = req.body;
  const logoId = metadata.logoId;
  console.log("tap_id", req.body);
  const logo = await Logo.findByIdAndUpdate(
    logoId,
    { isVerified: true },
    { new: true }
  );

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

//test
export const test = async (req, res) => {
  const paymentData = req.body; // Parse JSON payload
  console.log('Webhook received:', paymentData);

  if (paymentData.status === 'CAPTURED') {
    console.log('Payment successful:', paymentData);
  } else {
    console.log('Payment status:', paymentData.status);
  }

  res.status(200).send('Webhook received');
};
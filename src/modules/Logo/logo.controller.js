import Logo from "../../../DB/models/logo.model.js";

//&====================== ADD LOGO ======================&//
export const addLogo = async (req, res, next) => {
  const { title, description, rows, cols, logoLink, selectedCells } = req.body;
  let pixels = [];

  selectedCells.forEach((cell, index) => {
    const pixelNumber = cell.cellId;
    const smallImage = cell.canvasData;
    const pixel = { pixelNumber, smallImage };
    pixels.push(pixel);
  });

  // Save the logo to the database
  const logo = await Logo.create({
    title,
    description,
    image: "s",
    rows,
    cols,
    pixels,
    logoLink,
  });
  if (!logo) {
    return res.status(400).json({ message: "Failed to add logo" });
  }
  return res.status(201).json({ message: "Logo added successfully", logo });
};

//&====================== GET LOGOS ======================&//
export const getLogos = async (req, res, next) => {
  const logos = await Logo.find();
  if (!logos) {
    return res.status(400).json({ message: "Failed to fetch logos" });
  }
  return res.status(200).json({ logos });
};

const Bit = require('../models/bit');

// GET all bits
const getBits = async (req, res) => {
  try {
    const bits = await Bit.find();
    res.status(200).json(bits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bits' });
  }
};

// POST new bit (secured)
const addBit = async (req, res) => {
  const { Name, Type, Attack, Defense, Stamina, Burst, Dash, Weight } = req.body;

  try {
    const newBit = new Bit({ Name, Type, Attack, Defense, Stamina, Burst, Dash, Weight });
    await newBit.save();
    res.status(201).json({ message: 'Bit added successfully', bit: newBit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add bit' });
  }
};

exports.getBits = getBits;
exports.addBit = addBit;

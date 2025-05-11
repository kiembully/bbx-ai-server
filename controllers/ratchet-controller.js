const Ratchet = require('../models/ratchet');

// GET all ratchets
const getRatchets = async (req, res) => {
  try {
    const ratchets = await Ratchet.find();
    res.status(200).json(ratchets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratchets' });
  }
};

// POST new ratchet (protected)
const addRatchet = async (req, res) => {
  const { Name, Attack, Defense, Stamina, Weight } = req.body;

  try {
    const newRatchet = new Ratchet({ Name, Attack, Defense, Stamina, Weight });
    await newRatchet.save();
    res.status(201).json({ message: 'Ratchet added', ratchet: newRatchet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add ratchet' });
  }
};

exports.getRatchets = getRatchets;
exports.addRatchet = addRatchet;

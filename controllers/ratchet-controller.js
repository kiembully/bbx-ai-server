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

const editRatchet = async (req, res) => {
  try {
    const RatchetId = req.params.id;

    const fields = [
      'Name',
      'Attack',
      'Defense',
      'Stamina',
      'Weight',
    ];

    let updatedFields = {};

    // Only include fields that are present in req.body
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updatedFields[field] = req.body[field];
      }
    });

    // Optional: if a new image is uploaded
    if (req.file) {
      updatedFields.Image = req.file.path; // Cloudinary URL
    }

    const updatedRatchet = await Ratchet.findByIdAndUpdate(RatchetId, updatedFields, {
      new: true,
      runValidators: true
    });

    if (!updatedRatchet) {
      return res.status(404).json({ message: 'Ratchet not found' });
    }

    res.status(200).json({ message: 'Ratchet updated', Ratchet: updatedRatchet });

  } catch (err) {
    console.error('Ratchet update failed:', err);
    res.status(500).json({ message: 'Failed to update Ratchet' });
  }
};

exports.getRatchets = getRatchets;
exports.addRatchet = addRatchet;
exports.editRatchet = editRatchet;

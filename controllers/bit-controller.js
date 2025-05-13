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

const editBit = async (req, res) => {
  try {
    const bitId = req.params.id;

    const fields = [
      'Name',
      'Type',
      'Attack',
      'Defense',
      'Stamina',
      'Burst',
      'Dash',
      'Weight'
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

    const updatedBit = await Bit.findByIdAndUpdate(bitId, updatedFields, {
      new: true,
      runValidators: true
    });

    if (!updatedBit) {
      return res.status(404).json({ message: 'Bit not found' });
    }

    res.status(200).json({ message: 'Bit updated', Bit: updatedBit });

  } catch (err) {
    console.error('Bit update failed:', err);
    res.status(500).json({ message: 'Failed to update Bit' });
  }
};

exports.getBits = getBits;
exports.addBit = addBit;
exports.editBit = editBit;

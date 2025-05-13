const Blade = require("../models/blade");

const getBlades = async (req, res) => {
  try {
    const blades = await Blade.find();
    res.status(200).json(blades);
  } catch (error) {
    console.error('Failed to fetch blades:', error);
    res.status(500).json({ error: 'Failed to fetch blades' });
  }
};

const createBlade = async (req, res) => {
  try {
    const { Name, Spin, Series, Type, Attack, Defense, Stamina, Weight } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary multer stores the uploaded image's URL in `req.file.path`
    }

    const newBlade = new Blade({
      Name,
      Spin,
      Series,
      Type,
      Attack,
      Defense,
      Stamina,
      Weight,
      Image: imageUrl
    });

    await newBlade.save();

    res.status(201).json({ message: 'Blade created', blade: newBlade });
  } catch (err) {
    console.error('Blade creation failed:', err);
    res.status(500).json({ message: 'Failed to create blade' });
  }
};

const editBlade = async (req, res) => {
  try {
    const bladeId = req.params.id;

    const fields = [
      'Name',
      'Spin',
      'Series',
      'Type',
      'Attack',
      'Defense',
      'Stamina',
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

    const updatedBlade = await Blade.findByIdAndUpdate(bladeId, updatedFields, {
      new: true,
      runValidators: true
    });

    if (!updatedBlade) {
      return res.status(404).json({ message: 'Blade not found' });
    }

    res.status(200).json({ message: 'Blade updated', blade: updatedBlade });

  } catch (err) {
    console.error('Blade update failed:', err);
    res.status(500).json({ message: 'Failed to update blade' });
  }
};

exports.getBlades = getBlades;
exports.createBlade = createBlade;
exports.editBlade = editBlade;
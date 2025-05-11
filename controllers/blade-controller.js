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

    const newBlade = new Blade({
      Name,
      Spin,
      Series,
      Type,
      Attack,
      Defense,
      Stamina,
      Weight,
    });

    await newBlade.save();

    res.status(201).json({ message: 'Blade created', blade: newBlade });
  } catch (err) {
    console.error('Blade creation failed:', err);
    res.status(500).json({ message: 'Failed to create blade' });
  }
};


exports.getBlades = getBlades;
exports.createBlade = createBlade;
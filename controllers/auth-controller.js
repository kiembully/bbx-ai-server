const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const dummyUserId = 'user123';

  const token = jwt.sign({ id: dummyUserId }, process.env.JWT_SECRET_KEY, {
    expiresIn: '1h',
  });

  res.status(200).json({ token });
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide User ID and Password' });
    }

    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid User ID or Password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid User ID or Password' });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

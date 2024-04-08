// controllers/promoteToAdminController.js
const User = require('../models/user'); // Adjust the path as necessary

const promoteToAdmin = async (req, res) => {
  const email = req.params.email; // Extract email from URL parameters
  console.log(`Received call to promote ${email} to admin`);

  if (!email) {
    return res.status(400).send({ message: 'Email parameter is required.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }

    // Check if the user is already an admin
    if (user.isAdmin) {
      return res.status(409).send({ message: 'User is already an admin.' });
    }

    // Promote the user to admin
    await user.update({ isAdmin: true });
    return res.status(200).send({ message: 'User promoted to admin successfully.' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return res.status(500).send({ message: 'Failed to promote user to admin.' });
  }
};

module.exports = promoteToAdmin;

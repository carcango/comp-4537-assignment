// controllers/deleteUserController.js
const { User } = require('../models/user') // Adjust the path as necessary

const deleteUser = async (req, res) => {
  const email = req.params.email // Extract email from URL parameters
  console.log(`recieved call to delete ${email}`)
  if (!email) {
    return res.status(400).send({ message: 'Email parameter is required.' })
  }

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).send({ message: 'User not found.' })
    }

    // Delete the user
    await user.destroy()
    return res.status(200).send({ message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return res.status(500).send({ message: 'Failed to delete user.' })
  }
}

module.exports = deleteUser

const User = require('../models/user') // Adjust the path as needed
const {
  RESPONSE_CODES,
  RESPONSE_MSG
} = require('../constants') // Adjust the path as needed

exports.resetApiCallCount = async (req, res) => {
  try {
    const email = req.params.email
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return res
        .status(RESPONSE_CODES.NOT_FOUND_404)
        .send(RESPONSE_MSG.NOT_FOUND_404)
    }

    user.apiCallCounter = 0

    await user.save()
    return res.json({ message: 'API call count has been reset!' })
  } catch (error) {
    console.error('Error resetting API call count! ' + error)
    return res.status(RESPONSE_CODES.SERVER_ERROR_500).send(RESPONSE_MSG.SERVER_ERROR_500)
  }
}

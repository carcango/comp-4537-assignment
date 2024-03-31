const OpenAI = require('openai')
const { RESPONSE_CODES, RESPONSE_MSG } = require('../constants')

const OPENAI_API_KEY = process.env.OPENAI_API_TOKEN
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

exports.handleImageGeneration = async (req, res) => {
  try {
    const { prompt } = req.body

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1
    })

    const imageUrl = response.data[0].url
    res.json({ imageUrl, apiCallCounter: req.user.apiCallCounter })
  } catch (error) {
    console.error('Error generating image! ' + error)
    res
      .status(RESPONSE_CODES.SERVER_ERROR_500)
      .json({ error: RESPONSE_MSG.SERVER_ERROR_500 })
  }
}

import { useEffect, useState } from 'react'
import OpenAI from 'openai'
const apiKey = import.meta.env.VITE_OPENAI_API_KEY

function AIComponent() {
  const [response, setResponse] = useState(null)

  // function to read the ingredients and instructions out loud using the browser's speech synthesis api
  function handleRead() {
    // this reads from the response object that is set in state
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(response.ingredients.join('/n'))
    )
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(response.instructions)
    )


  function handlePause() {
    window.speechSynthesis.pause()
  }

  function handleResume() {
    window.speechSynthesis.resume()
  }

  useEffect(() => {
    async function main() {
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      })

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Read the text in the image. Create a json object with two keys. One key is ingredients and the other key is instructions. The value of the ingredients key is a asterisk separated string of ingredients from the image. The value of the instructions key is a asterisk separated string of instructions from the image. Separate each ingredient based on the line separation.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'https://res.cloudinary.com/jdrichardstech/image/upload/v1721808285/Screen_Shot_2024-07-24_at_4.04.16_AM_quebco.png',
                  detail: 'high',
                },
              },
            ],
          },
        ],
      })
      console.log(response.choices[0].message.content)

      const content = response.choices[0].message.content
        .replace(/```json|```/g, '')
        .trim()

      //   console.log('Received string:', content)

      // Attempt to parse the JSON string
      const jsonResponse = JSON.parse(content)
      console.log('Parsed object:', jsonResponse)
      setResponse({
        ingredients: jsonResponse.ingredients.split('*'),
        instructions: jsonResponse.instructions.split('*'),
      })
    }
    main()
  }, [])

  return (
    <div>
      {response && (
        <>
          Ingredients:{' '}
          {response?.ingredients && (
            <ol style={{ listStyleType: 'decimal' }}>
              {response.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ol>
          )}
          <br />
          <br />
          <h2></h2>
          Instructions: {response?.instructions && response.instructions}
          <div>
            {' '}
            <button
              style={{ width: '160px', height: '40px' }}
              onClick={handleRead}
            >
              Read Recipe Out Loud
            </button>
            <button onClick={handlePause}>Pause</button>
            <button onClick={handleResume}>Resume</button>
          </div>
        </>
      )}
    </div>
  )
}

export default AIComponent

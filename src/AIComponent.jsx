import { useEffect, useState } from 'react'
import OpenAI from 'openai'
const apiKey = import.meta.env.VITE_OPENAI_API_KEY

function AIComponent() {
  const [response, setResponse] = useState(null)
  const [rate, setRate] =
    useState(1) / // Default rate
    function handleRead() {
      if (!response) {
        console.error('Response is not set')
        return
      }

      if (!response.ingredients || !response.instructions) {
        console.error('Response does not have the expected structure', response)
        return
      }

      console.log('Reading ingredients and instructions')
      const ingredientsUtterance = new SpeechSynthesisUtterance(
        response.ingredients.join('\n')
      )
      const instructionsUtterance = new SpeechSynthesisUtterance(
        response.instructions
      )

      // Set the rate of speech
      ingredientsUtterance.rate = rate
      instructionsUtterance.rate = rate

      // Speak the ingredients and instructions
      window.speechSynthesis.speak(ingredientsUtterance)
      window.speechSynthesis.speak(instructionsUtterance)
    }

  // Pause the speech
  function handlePause() {
    window.speechSynthesis.pause()
  }
  // Resume the speech
  function handleResume() {
    window.speechSynthesis.resume()
  }

  // Stop the speech
  function handleStop() {
    window.speechSynthesis.cancel()
  }

  // Increase the rate of speech, you must press stop if you want to adjust the speed and the recording is already playing. Then press play again.
  function increaseRate() {
    setRate((prevRate) => Math.min(prevRate + 0.1, 10)) // Max rate is 10
  }

  // Decrease the rate of speech, you must press stop if you want to adjust the speed and the recording is already playing. Then press play again.
  function decreaseRate() {
    setRate((prevRate) => Math.max(prevRate - 0.1, 0.1)) // Min rate is 0.1
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
            <button
              style={{ width: '160px', height: '40px' }}
              onClick={handleRead}
            >
              Play Recipe
            </button>
            <button onClick={handlePause}>Pause</button>
            <button onClick={handleResume}>Resume</button>
            <button onClick={handleStop}>Stop</button>
            <div>
              <button onClick={decreaseRate}>-</button>
              <span> Speed: {rate.toFixed(1)} </span>
              <button onClick={increaseRate}>+</button>
              <br />
              <p style={{ color: 'red', fontSize: '1rem' }}>
                Adjust speed before clicking play OR You must click stop to
                adjust speed and click Play Recipe again. This will restart at
                the beginning, unfortunately. There is no setting to Pause or
                Auto Change with this API
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AIComponent

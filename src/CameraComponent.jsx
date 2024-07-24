//This is a simple example of how to use the openai api to send an image to the api and get a response. You would normally abstract these functions into a helper file and director. But I left them here so that you could see how they all connect. The main function, uploadToCloudinary, is used to upload the image to cloudinary and get the url. The promptAi function is used to send the image to the openai api and get a response. The capture function is used to capture the image from the webcam and send it to the openai api. Both the uploadToCloudinary and promptAi functions are called in the capture function.

import { useRef, useState, useEffect } from 'react'
import OpenAI from 'openai'
import Webcam from 'react-webcam'
import axios from 'axios'
const apiKey = import.meta.env.VITE_OPENAI_API_KEY
console.log('hello', apiKey)
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
import './CameraComponent.css'

const CameraComponent = () => {
  const webcamRef = useRef(null)
  const [imageSrc, setImageSrc] = useState(null)
  const [response, setResponse] = useState(null)
  const [devices, setDevices] = useState([])
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null)

  const handleDevices = (mediaDevices) => {
    setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput'))
  }

  useEffect(() => {
    //get the devices
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [])

  //
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: { exact: 'environment' },
  }

  // function to send image to openai api
  async function promptAi(imageUrl) {
    //create a new openai instance
    //You need a key in the .env file called VITE_OPENAI_API_KEY with your openai api key
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    })

    //send the image to the openai api, the more specific the prompt the better the results. Return a json object with two keys, ingredients and instructions.
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
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
    })
    console.log(response.choices[0].message.content)

    //parse the response which often returns with a lot of extra text.
    const content = response.choices[0].message.content
      .replace(/```json|```/g, '')
      .trim()

    //parse the response into a json object
    const jsonResponse = JSON.parse(content)
    console.log('Parsed object:', jsonResponse)

    //return the json object which will be set in state and used to display the ingredients and instructions
    return jsonResponse
  }

  //function to upload image to cloudinary and return the url. You need two keys in the .env file, CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.
  //The clou are located in your Cloudinary account.
  const uploadToCloudinary = async (base64Image) => {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    const data = {
      file: base64Image,
      upload_preset: uploadPreset,
    }

    try {
      //send the image to cloudinary
      const response = await axios.post(url, data)
      console.log('Cloudinary response:', response.data)
      return response.data.secure_url
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      return null
    }
  }

  //function to capture the image from the webcam
  const capture = async () => {
    if (webcamRef.current) {
      //get the image from the webcam
      const imageSrc = webcamRef.current.getScreenshot()
      console.log('Captured image source:', imageSrc)
      //set the image in state
      setImageSrc(imageSrc)

      //upload the image to cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageSrc)
      if (cloudinaryUrl) {
        //send the image to the openai api and set the response in state
        // you may not have to do all of this depending on your use case.
        console.log('Uploaded to Cloudinary:', cloudinaryUrl)
        setCloudinaryUrl(cloudinaryUrl)
        const jsonResponse = await promptAi(cloudinaryUrl)
        setResponse({
          ingredients: jsonResponse.ingredients.split('*'),
          instructions: jsonResponse.instructions.split('*'),
        })
      }
    } else {
      console.error('Webcam reference is null')
    }
  }

  return (
    <div>
      {/* Webcam component which comes from react-webcam. Check docs for attributes. https://www.npmjs.com/package/react-webcam*/}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="responsive-webcam"
      />
      <button onClick={capture}>Capture photo</button>
      {imageSrc && (
        <div>
          <h2>Preview</h2>
          <img src={imageSrc} alt="Captured" />
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
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
            Instructions:{' '}
            {response?.instructions &&
              response.instructions.map((instruction, index) => (
                <li key={index}>
                  Step {index + 1}: {instruction}
                </li>
              ))}
          </>
        )}
      </div>
      {/* If you want to expose the cloudinary url to the user you can uncomment the following code. */}
      {/* {cloudinaryUrl && (
        <div>
          <h2>Uploaded Image URL</h2>
          <a href={cloudinaryUrl} target="_blank" rel="noopener noreferrer">
            {cloudinaryUrl}
          </a>
        </div>
      )} */}
    </div>
  )
}

export default CameraComponent

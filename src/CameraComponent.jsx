import { useRef, useState, useEffect } from 'react'
import OpenAI from 'openai'
import Webcam from 'react-webcam'
import axios from 'axios'
const apiKey = import.meta.env.VITE_OPENAI_API_KEY
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
import './CameraComponent.css'

const CameraComponent = () => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  })

  const webcamRef = useRef(null)
  const [imageSrc, setImageSrc] = useState(null)
  const [response, setResponse] = useState(null)
  const [devices, setDevices] = useState([])
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null)

  const handleDevices = (mediaDevices) => {
    setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput'))
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [])

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: { exact: 'environment' },
  }

  async function promptAi(imageUrl) {
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

    const content = response.choices[0].message.content
      .replace(/```json|```/g, '')
      .trim()

    const jsonResponse = JSON.parse(content)
    console.log('Parsed object:', jsonResponse)
    return jsonResponse
  }

  const uploadToCloudinary = async (base64Image) => {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    const data = {
      file: base64Image,
      upload_preset: uploadPreset,
    }

    try {
      const response = await axios.post(url, data)
      console.log('Cloudinary response:', response.data)
      return response.data.secure_url
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      return null
    }
  }

  const capture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      console.log('Captured image source:', imageSrc)
      setImageSrc(imageSrc)

      const cloudinaryUrl = await uploadToCloudinary(imageSrc)
      if (cloudinaryUrl) {
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
            Instructions: {response?.instructions && response.instructions}
          </>
        )}
      </div>
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

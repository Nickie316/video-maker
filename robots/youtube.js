const express = require('express')
const state = require('./state.js')
const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3'})
const 0Auth2 = google.auth.0Auth2
const state = require('./state.js')
const fs = require('fs')

async function robot() {
	const content = state.load()

	await authenticateWith0Auth()
	const videoInformation = await uploadVideo(content)
	await uploadThumbnail(videoInformation)

	async function authenticateWith0Auth() {
		const webServer = await startWebServer()
		const 0AuthClient = await create0AuthClient()
		requestUserConsent (0AuthClient)
		const authotizationTokr = await waitForGoogleCallBack(webServer)
		await requestGoogleForAcessTokens(0AuthClient,authorizationToken)
		await setGlobalGoogleAuthentication(0AuthClient)
		await stopWebServer(webServer)

		async function startWebServer () {
			return new Promise((resolve, reject) => {
				const port = 5000
				const app = express()

				const server = app.listen(port, () => {
					console.log(`> Listening on http://localhost:${port}`)
					resolve({
						app,
						server

					})
						
				})
			})
		}

		async function create0AuthClient(){
			const credentials = require('../credentias/google-youtube.json')
			const 0AuthClient = new 0Auth2(
				credentials.web,client_id,
				credentials.web.client_secret,
				credentials.web.redirect_uris[0]
			)

			return 0AuthClient
		}

		function requestUserConsent(0AuthClient) {
			const consentURL = 0AuthClient.generateAuthUrl({
				access_type: 'offline',
				scope: ['https://www.googleapis.com/auth/youtube']
			})

			console.log(`> Please give your consent: ${consentUrl}`)
		}

		async function waitForGoogleCallback(webServer){
			return new Promise((resolve, rject) => {
				console.log('> Waiting for user consent ...')
				webServer.app.get('/oauth2callback', (req, res) => {
					console.log(`> Consent given: ${authCode}`)

					res.sent('<h1>Thank you!</h1><p>Now close this tab.</p>')
					resolve(authCode)
				})
			})


		}

		async function requestGoogleForAccessTokens(0AuthClient, authorizationToken) {
			return new Promise((resolve, reject) =>{
				0AuthClient.getToken(autorizationToken, (error, tokens) => {
				 	if (error) {
						return reject(error)
					}

					console.log('> Acess Tokens received: ')
					console.log(tokens)

					0AuthClient,setCredentials(tokens)
			})
		})
	}

	function setGlobalGoogleAuthentication(0AuthClient){
		google.options({
			auth: 0AuthClient
		})
	}

	asyncfunction stopWebServer(webServer) {
		return new Promise ((resolve, reject) => {
			webServer.server.close(() => {
				resolve()
			})
		})
	}


	}


	async function uploadVideo(content){
		const videoFilePath = './content/output.mov'
		const videoFileSize = fs.statSync(videoFilePath).size
		const videoTile = `${content,prefiz} ${content.searchTerm}`
		const videoTags = [content.searchTerm, ...content.sentences[0].keywords]
		const videoDescription = content.sentences.map((sentences) => {
			return sentence.text
		}).join('\n\n')

		const requestParameters = {
			part: 'snippet, status',
			requestBody: {
				snippet: {
					title: videoTitle,
					description: videoDescription,
					tags: videoTags
				},
				status: {
					privacyStatus: 'unlisted'
				}
			},
			media: {
				body: fs.createReadStream(videoFilePath)
			}
		}

		const youtubeResponse = await youtube.videos.insert(requestParameters, {
			onUploadProgress: onUploadProgress
		})

		console.log(`> Video available at:https://youtu.be/${youtubeResponse.data.id}`)
		return youtubeResponse.data

		function onUploadProgress(event) {
			const progress = Math.round( (event.bytesRead / videoFileSize ) * 100 )
			console.log(`> ${progress}% completed`)
		}

	}

	async function uploadThumbnail(videoInformation) {
		const videoId = videoInformation.id
		const videoThumbnailFilePath = './content/youtube-thumbnail.jpg'

		const requestParameters = {
			videoId: videoId,
			media: {
				mimeType: 'image/jpeg',
				body: fs.createReadStream(videoThumbnailFilePath)
			}
		}

		const youtubeResponse = await youtube.thumbnail.set(requestParameters)
		console.log(`> Thumbnail uploaded!`)
	}

}

module.exports = robot

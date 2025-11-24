require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./utils/logger')
const errorHandler = require('./middleware/errorHandler')
const connectToDB = require('./database/db')
const mediaRoutes = require('./routes/media-routes')
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq')
const { handlePostDeleted } = require('./eventHandlers/media-event-handlers')

const app = express()
const PORT = process.env.PORT || 3003

connectToDB()

app.use(cors())
app.use(helmet())
app.use(express.json())

app.use((req,res, next) => {
   logger.info(`Received ${req.method} request to ${req.url}`)
   logger.info(`Request body, ${req.body}`)
   next()
 }
)

app.use('/api/media', mediaRoutes)

app.use(errorHandler)

async function startServer(){
  try{
    await connectToRabbitMQ()

    //Consume all the events
    await consumeEvent('post.deleted', handlePostDeleted)

    app.listen(PORT, () => {
        logger.info(`Media Service is running on port ${PORT}`)
       })
   }catch(error){
      logger.error('Failed to connect to server', error)
      process.exit(1)
  }
}

startServer()

// unhandled promise rejection 
process.on('unhandledRejection',(reason, promise) => {
    logger.error('Unhandled Rejection at', promise, 'reason:', reason)
})

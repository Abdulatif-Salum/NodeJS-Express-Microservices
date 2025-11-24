const mongoose = require('mongoose')
const logger = require('../utils/logger')

 const connectToDB = async()=> {
  try{
    mongoose.connect(process.env.MONGODB_URI)
    logger.info('Connected to mongodb')
  }catch(error){
    logger.error('Mongodb Connection error', error)
 }
 }

 module.exports = connectToDB
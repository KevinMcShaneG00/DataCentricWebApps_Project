const MongoClient = require('mongodb').MongoClient
var coll

//set up the connection
MongoClient.connect('mongodb://127.0.0.1:27017')
    .then((client) => {
        db = client.db('proj2023MongoDB')
        coll = db.collection('managers')
    })
    .catch((error) => {
        console.log(error.messge)
    })

var managersFindAll = function () {
    return new Promise((resolve, reject) => {
        var cursor = coll.find()
        cursor.toArray()
            .then((documents) => {
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var managersAddOne = function (details) {
    return new Promise((resolve, reject) => {
        coll.insertOne(details)
            .then((documents) => {
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

//make a function to find a record based on _id
var findManagerById = function (id) {
    return new Promise((resolve, reject) => {
        var cursor = coll.find( { _id : id} )
        cursor.toArray()
            .then((documents) => {
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

module.exports = { managersFindAll, managersAddOne, findManagerById }
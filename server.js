const mongo = require('mongodb').MongoClient
// This will allow us to run socket.io on port 4000
const client = require('socket.io').listen(4000).sockets

// Connect to Mongo
mongo.connect('mongodb://localhost/mongochat', (err, db) => {
    if (err) {
        throw err
    }
    console.log('mongodb connected...')

    // Connect to Socket.io
    client.on('connection', socket => {
        let chat = db.collection('chats')

        // Create a function to send status
        sendStatus = s => socket.emit('status', s)

        // Get chats from mongo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray((err, res) => {
            if (err) {
                throw err
            }

            // Emit the messages
            socket.emit('output', res)
        })

        // Handle input events
        socket.on('input', data => {
            let name = data.name
            let message = data.message

            // Check for name and message
            if (name == '' || message == '') {
                // Send the error status
                sendStatus('please enter a name and message')
            } else {
                // Insert Message
                chat.insert({name: name, message: message}, () => {
                    client.emit('output', [data])

                    // Send status object
                    sendStatus({ message: 'message sent', clear: true })
                })
            }
        })

        // Handle clear
        socket.on('clear', data => {
            // Remove all chats from the collection
            chat.remove({}, () => {
                socket.emit('cleared')
            })
        })
    })
})
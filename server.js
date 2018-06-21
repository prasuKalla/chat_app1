var mongo = require('mongodb').MongoClient;
var client = require('socket.io').listen(4000).sockets;

//connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }


    console.log('MongoDB connected...');

    //connect to socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');
        //function to send status to client
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            //emit the messages (result of chat database )to the client i.e., the output.html
            socket.emit('output', res);
        });

        //handle  input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            //check for the name and message in the user input request
            if(name == '' || message == ''){
                //send error status
                sendStatus('Please enter the name and the message');
            }
            else{
                //insert the message
                chat.insert({
                    name: name,
                    message: message
                }, function(){
                    client.emit('output', [data]);

                    //send status object
                    sendStatus({
                        message: 'Message sent!',
                        clear: true
                    });
                });               
            }
        });

        //handle clear
        socket.on('clear', function(data){
            //remove all chats from the collection
            chat.remove({}, function(){
                //emit cleared
                socket.emit('cleared');
            });
        });
    });

});
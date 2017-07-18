//setup server
var express = require('express');
var app = express();
var server = require('http').createServer(app);

//setup RTI connector
var sleep = require('sleep');
var rti   = require('rticonnextdds-connector');
var connector = new rti.Connector("MyParticipantLibrary::Zero",__dirname + "/../dds_mgr.xml");
var subscriber = connector.getInput("MySubscriber::EdgeStatusReader");
var publisher = connector.getOutput("MyPublisher::EdgeControlWriter");

//setup socket
var io = require('socket.io')(server);

//setup server ID
var ID = "C2SYSTEM";

server.listen(1337, function() {
    console.log('Server listening at port %d', 1337);
});


//host the index file
app.use(express.static(__dirname+"/.."));

io.on('connection', function(socket) {
    socket.on("publishControl", function(JSON) {
        publishControl(ID,JSON.target_machine,JSON.target_node,JSON.control_state)
    });
});

connector.on('on_data_available',
   function() {
     subscriber.take();
     for (i=1; i <= subscriber.samples.getLength(); i++) {
         if (subscriber.infos.isValid(i)) {
             //console.log(JSON.stringify(subscriber.samples.getJSON(i)));
             io.emit("status",subscriber.samples.getJSON(i));
         }
     }
     //publishControl("testID","machineID",0,0);
});

function publishControl(id,target_machine,target_node,control_state){
    /* We clear the instance associated to this output
       otherwise the sample will have the values set in the
       previous iteration
    */
    publisher.clear_members();
    publisher.instance.setString("id", id);
    publisher.instance.setString("target_machine",target_machine);
    publisher.instance.setNumber("target_node",target_node);
    publisher.instance.setNumber("control_state",control_state);
    console.log("Writing...");
    publisher.write();
    //sleep.sleep(2);
}



var five = require('johnny-five')
var nforce = require('nforce');

board = new five.Board();

// add these as env variables
var client_id ='';
var client_secret ='';

var org = nforce.createConnection({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: 'http://localhost:3000/oauth/_callback',
  mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
});

// When the Arduino board is ready and connected
board.on("ready", function(){
  // nforce Authentication
  org.authenticate({ username: '', password: '' },
    function(err, oauth) {
      if(err) return console.log(err);

      // subscribe to a pushtopic
      var str = org.stream({ topic: 'LightStateChanges', oauth: oauth });
      str.on('connect', function(){  console.log('connected to pushtopic'); });
      str.on('error', function(error) { console.log('error: ' + error); });

      // control lights
      str.on('data', function(data) {
        switch (data.sobject.State__c) {
          case 'ON':
            five.Led(data.sobject.PIN__c).on();
            break;
          case 'OFF':
            five.Led(data.sobject.PIN__c).off();
            break;
        }
      });

      // Instantiate button (pin 8)
      button = new five.Button(8);
      // when the button is pressed...
      button.on("down", function() {
          // create a chatter post (FeedItem)
          var post = nforce.createSObject('FeedItem');
          post.set('Body', 'DING-DONG! Somebody is at the front door ringing the bell.');
          post.set('ParentId','0F9i0000000LNqZ')
          org.insert({ sobject: post, oauth: oauth }, function(err, resp){ if(err) console.log(err)
          });
      });
  });
});

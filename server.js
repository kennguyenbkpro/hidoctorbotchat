var express = require('express'); //express handles routes
var http = require('http'); //need http module to create a server
var request = require('request');
var app = express(); //starting express
app.set('port', process.env.PORT || 3000); //set port to cloud9 specific port or 3000
app.use(express.bodyParser()); //body parser used to parse request data
app.use(app.router);
app.get('/', verificationHandler);
app.post('/',handleMessage);

var request_url = "https://graph.facebook.com/v2.6/me/messages?access_token=EAAQExoa2aI4BAPiFTQodpKrF76j9NMt1mhiehyjodZCZAcZAEMUhfxglwPZA6sdPhtwZA8ZCUC2CGS4EoYWpCMi7t75o6BmRPL92JFcwVx3ZAn57YvTMyg1QxZA0LaT0yf1VJHpTSYiNayZCWPTeqX3I0ACpyfGCUhgdTZCIAzTUFrMAZDZD"; //replace with your page token

var msg_tem = require('./msg_template.js');
var convs = require('./conversation.js');
var model = require('./model.js');

function verificationHandler(req, res) {
  console.log(req);
  if (req.query['hub.verify_token'] === 'verifycode') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token!!');
}


var converArray = [];

function handleMessage(req, res) {
    var messaging_events = req.body.entry[0].messaging;
    for (var i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;
        if (event.message && event.message.quick_reply && event.message.quick_reply.payload){
          handleReplies(sender, event.message.quick_reply.payload);
        }
        else if (event.message && event.message.text) {
            var text = event.message.text.toLowerCase().trim();
            console.log(text);
            if (text.toLowerCase().substr(0,4) == 'exit') {
              if (converArray[sender] != null){
                converArray[sender] = null;
              }
            }
            if (converArray[sender] == null){
              sendWelcomeScreen(sender);
            } else {
              handleConversation(converArray[sender], text);
            }
        }
        else if(event.postback && event.postback.payload){
          handlePostBack(sender,event.postback.payload);
        }
    }
    res.end('replied!');
}

function sendWelcomeScreen(uid){
  sendRequest(msg_tem.createWelcomeMessage(uid, request_url).options);
}

function handleConversation(conversation, msg){
  conversation.server.setMsg(msg, function(mode, reply){
    try {
      switch(mode){
        case 0://text
          sendTextMessage(conversation.uid, reply); 
          break;
        case 1://search
          sendRequest(msg_tem.creatSearchInfoMessage(conversation.uid, request_url, reply).options);
          break;
        case 2://area
          sendRequest(msg_tem.createChooseAreaMessage(conversation.uid, request_url, model.getAreaArray(), reply).options);
          break;
        case 3://training
          sendRequest(msg_tem.createChooseTrainingFunctionMsg(conversation.uid, request_url).options);      
          break;  
        case 4:
          var doc = model.createEmptyQuestion();
          doc.question = reply;
          model.insertQuestionToDB(db, doc, function(id){
            console.log("Inserted " + id);
          });
          break;
        case 5:
          var doc2 = model.createEmptyDisease();
          doc2.title = reply.title;
          doc2.short_des = reply.short_des;
          model.insertDiseaseToDB(db, doc2, function(id){
            console.log("Inserted " + id);
          });
          break;
        case 6:
          //Search question with keyword
          var array = [];
          model.searchQuestionFromDB(db, msg, function(ques, size){
            if (size == 0 && ques.length > 0){
              sendRequest(msg_tem.creatChooseQuestionMessage(conversation.uid, request_url, ques).options);
            } else if (ques.length == 0) {
              sendTextMessage(conversation.uid, "Không có câu hỏi nào, bạn thử search từ khác xem!");
            }
          }, array);
          break;
        case 7:
          //Search disease with keyword
          var array2 = [];
          model.searchDiseaseFromDB(db, msg, function(ques, size){
            if (size == 0 && ques.length > 0){
              sendRequest(msg_tem.creatChooseDiseaseMessage(conversation.uid, request_url, ques).options);
            } else if (ques.length == 0) {
              sendTextMessage(conversation.uid, "Không có bệnh nào, bạn thử search từ khác xem!");
            }
          }, array2);
          break;
          
        case 8:
          model.getDiseaseFromDB(db, ObjectId(reply.d_id), function(disease){
              if (disease && disease.question && disease.question.indexOf(reply.quest_id) < 0){
                disease.question.push(reply.quest_id);
                
                model.linkQuestion(db, function(){
                  console.log("linked question");  
                }, disease._id, disease.question);
              }
          });
          break;
        case 9:
          var array3 = [];
          model.searchQuestionFromDB(db, msg, function(ques, size){
            if (size == 0 && ques.length > 0){
              conversation.curQuestion = ques[0];
              var array4 = [];
              model.searchDiseaseFromDB(db, ques[0]._id.valueOf(), function(lDise, size){
                if (size == 0 && lDise.length > 0){
                  for (var i = 0 in lDise){
                    conversation.diseasePointArr = [];
                    conversation.diseasePointArr.push({
                      disease: lDise[i], point: 3
                    });
                  }
                }
              }, array4);
              sendRequest(msg_tem.createAskQuestionMessage(conversation.uid, request_url, ques[0]).options);
            } else if (ques.length == 0) {
              sendTextMessage(conversation.uid, "Mình không có thông tin về triệu chứng " + msg + " của bạn\n Chọn từ khóa khác đi bạn:");
            }
          }, array3);
          break;
        case 10:
          model.getQuestionFromDB(db, ObjectId(reply), function(nextQues){
            if (nextQues){
              conversation.curQuestion = nextQues;
              sendRequest(msg_tem.createAskQuestionMessage(conversation.uid, request_url, nextQues).options);
            }
          });
          break;
      }  
    } catch (err){
      console.log(err);
    }
    
  });
}

function handlePostBack(uid, payload){
  if (payload === msg_tem.FIND_INFO){
      converArray[uid] = convs.createConversation(uid, convs.MODE_SEARCH);
      sendTextMessage(uid, "Bạn có thể nhờ mình tìm thông tin về các loại bệnh tật bằng cách nhập vào từ khóa.\nVí dụ: Viêm amidal, trào ngược dạ dày...");
  } else if (payload === msg_tem.CONSULTANT){
      converArray[uid] = convs.createConversation(uid, convs.MODE_CONSULTANT);
      handleConversation(converArray[uid], payload);
  } else if (payload === msg_tem.TRAINING){
      converArray[uid] = convs.createConversation(uid, convs.MODE_TRAINING);
      handleConversation(converArray[uid], payload);
  } else {
      handleConversation(converArray[uid], payload);
  }
}

function handleReplies(uid, payload){
  if (converArray[uid] != null){
    handleConversation(converArray[uid], payload);
  }
}

function sendTextMessage(id, msg) {
  sendRequest(msg_tem.createTextMessage(id, msg.toString(), request_url).options);
}

function sendRequest(options){
  request(options, function(error, response, body) {
    if (error) {
      console.log(error.message);
    }
  });
}



http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

var doc = model.createEmptyQuestion();
doc.question = "TEST question";
doc.ranking = 5;
doc.area = 2;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var dbUrl = "mongodb://" + process.env.IP + "/test";
var db;

MongoClient.connect(dbUrl, function(err, _db) {
    assert.equal(null, err);
    db = _db;
    model.indexDB(db, function(){
      
    });
    console.log("Database connected!");
  });
var FIND_INFO = "FIND_INFO";
var CONSULTANT = "CONSULTANT";
var TRAINING = "TRAINING";

var ADD_DISEASE = "ADD_DISEASE";
var ADD_QUES = "ADD_QUES";
var LINK_QUES = "LINK_QUES";

var CHOOSE_LINK_QUES = "CHOOSE_LINK_QUES";
var CHOOSE_LINK_DISEASE = "CHOOSE_LINK_DISEASE";

var AREA_PAYLOAD = "AREA_PAYLOAD";
var AREA_PAYLOAD_MORE = "AREA_PAYLOAD_MORE";

var ANSWER_YES = "ANSWER_YES";
var ANSWER_NO = "ANSWER_NO";
var ANSWER_SKIP = "ANSWER_SKIP";

module.exports = {
    FIND_INFO: FIND_INFO,
    CONSULTANT: CONSULTANT,
    TRAINING: TRAINING,
    
    ADD_DISEASE: ADD_DISEASE,
    ADD_QUES: ADD_QUES,
    LINK_QUES: LINK_QUES,
    CHOOSE_LINK_QUES: CHOOSE_LINK_QUES,
    CHOOSE_LINK_DISEASE: CHOOSE_LINK_DISEASE,
    
    AREA_PAYLOAD: AREA_PAYLOAD,
    AREA_PAYLOAD_MORE: AREA_PAYLOAD_MORE,
    
    ANSWER_YES: ANSWER_YES,
    ANSWER_NO: ANSWER_NO,
    ANSWER_SKIP: ANSWER_SKIP,
    
    createTextMessage: function (id, msg, request_url){
        return new TextMessage(id, msg, request_url);
    },
    
    createWelcomeMessage: function(id, request_url){
        return new WelcomeMessage(id, request_url);
    },
    
    creatSearchInfoMessage: function(id, request_url, data){
        return new SearchInfoMessage(id, request_url, data);
    },
    
    createChooseAreaMessage: function(id, request_url, dataArray, pos){
        return new ChooseAreaMessage(id, request_url, dataArray, pos);
    },
    
    createChooseTrainingFunctionMsg: function(id, request_url){
        return new ChooseTrainingFunctionMsg(id, request_url);
    },
    
    creatChooseQuestionMessage: function(id, request_url, data){
        return new ChooseQuestionMessage(id, request_url, data);
    },
    
    creatChooseDiseaseMessage: function(id, request_url, data){
        return new ChooseDiseaseMessage(id, request_url, data);
    },
    
    createAskQuestionMessage: function(id, request_url, question){
        return new AskQuestionMessage(id, request_url, question);
    },
};

function TextMessage(id, msg, request_url) {
    this.options = {
        uri: request_url,
        method: 'POST',
        json: {
          "recipient": {
            "id": id
          },
          "message": {
            "text": msg.length > 320? msg.substr(0,320) : msg
          }
        }
    };
}

function createGenericTemplate(id){
    return {
        recipient: {
          id: id
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: []
            }
          }
        }
    };
}

function createQuickRepliesTemplate(id, question){
    return {
        recipient: {
          id: id
        },
        message: {
            text: question,
            quick_replies: []
        }
    };
}

function WelcomeMessage(id, request_url){
    var myTemplate = createGenericTemplate(id);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    var myelement = {
          title: "Chào bạn! Bạn cần mình giúp gì nào?",
          subtitle: "Chọn một trong các tùy chọn.\nSelect one option:",
          buttons: [{
            type: "postback",
            title: "Tìm thông tin",
            payload: FIND_INFO
          }, {
            type: "postback",
            title: "Tư vấn sức khỏe",
            payload: CONSULTANT
          }, {
            type: "postback",
            title: "Huấn luyện",
            payload: TRAINING
          }]
    };
    myTemplate.message.attachment.payload.elements.push(myelement);
    this.options.body = myTemplate;
}

function SearchInfoMessage(id, request_url, dataArray){
    var myTemplate = createGenericTemplate(id);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    for (var i = 0 in dataArray){
        var data = dataArray[i];
            var myelement = {
              title: data.title,
              subtitle: data.short_description.length > 80? data.short_description.substr(0, 80).trim(): data.short_description,
              image_url: data.image_url,
              buttons: [{
                type: "web_url",
                url: data.url,
                title: "Xem chi tiết"
              }]
        };
        myTemplate.message.attachment.payload.elements.push(myelement);
    }
    this.options.body = myTemplate;
}


function ChooseAreaMessage(id, request_url, dataArray, pos){
    if (pos == -1){
        pos = 0;
        var info = "Mình chưa có kinh nghiệm về chuyên khoa này, mình sẽ cố gắng bổ sung kiến thức sớm để giúp bạn vào lần sau!\nMời bạn chọn chuyên khoa:";
    } else {
        info = "Mời bạn chọn chuyên khoa:";
    }
    var myTemplate = createQuickRepliesTemplate(id, info);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    if (pos >= dataArray.length) pos = 0;
    for (var i = pos; i < dataArray.length; i ++){
        if (i >= pos + 5){
            break;
        }
        var button = {
            content_type: "text",
            title: dataArray[i].name,
            payload: AREA_PAYLOAD + "_" + dataArray[i].code
        };
        myTemplate.message.quick_replies.push(button);
    }
    var more_but = {
        content_type: "text",
        title: "Chuyên khoa khác",
        payload: AREA_PAYLOAD_MORE + "_" + i
    };
    myTemplate.message.quick_replies.push(more_but);
    this.options.body = myTemplate;
}

function ChooseTrainingFunctionMsg(id, request_url){
    var myTemplate = createGenericTemplate(id);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    var myelement = {
          title: "Chào bạn! Bạn muốn làm gì?",
          subtitle: "Chọn một trong các tùy chọn.\nSelect one option:",
          buttons: [{
            type: "postback",
            title: "Thêm bệnh",
            payload: ADD_DISEASE
          }, {
            type: "postback",
            title: "Thêm câu hỏi",
            payload: ADD_QUES
          }, {
            type: "postback",
            title: "Kết nối câu hỏi",
            payload: LINK_QUES
          }]
    };
    myTemplate.message.attachment.payload.elements.push(myelement);
    this.options.body = myTemplate;
}


function ChooseQuestionMessage(id, request_url, dataArray){
    var myTemplate = createGenericTemplate(id);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    for (var i = 0 in dataArray){
        var data = dataArray[i];
            var myelement = {
              title: data.question,
              subtitle: "",//data.short_des.length > 80? data.short_des.substr(0, 80).trim(): data.short_des,
              buttons: [{
                type: "postback",
                title: "Chọn câu hỏi này",
                payload: CHOOSE_LINK_QUES + "_" + data._id
              }]
        };
        myTemplate.message.attachment.payload.elements.push(myelement);
    }
    this.options.body = myTemplate;
}

function ChooseDiseaseMessage(id, request_url, dataArray){
    var myTemplate = createGenericTemplate(id);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    for (var i = 0 in dataArray){
        var data = dataArray[i];
            var myelement = {
              title: data.title,
              subtitle: data.short_des.length > 80? data.short_des.substr(0, 80).trim(): data.short_des,
              buttons: [{
                type: "postback",
                title: "Chọn câu hỏi này",
                payload: CHOOSE_LINK_DISEASE + "_" + data._id
              }]
        };
        myTemplate.message.attachment.payload.elements.push(myelement);
    }
    this.options.body = myTemplate;
}


function AskQuestionMessage(id, request_url, question){
    var myTemplate = createQuickRepliesTemplate(id, question.question);
    this.options = {
        url: request_url,
        method: 'POST',
        body: myTemplate,
        json: true
    };
    var more_but = {
        content_type: "text",
        title: "Có",
        payload: ANSWER_YES + "_" + question._id
    };
    myTemplate.message.quick_replies.push(more_but);
    more_but = {
        content_type: "text",
        title: "Không",
        payload: ANSWER_NO + "_" + question._id
    };
    myTemplate.message.quick_replies.push(more_but);
    more_but = {
        content_type: "text",
        title: "Bỏ qua",
        payload: ANSWER_SKIP + "_" + question._id
    };
    myTemplate.message.quick_replies.push(more_but);
    this.options.body = myTemplate;
}
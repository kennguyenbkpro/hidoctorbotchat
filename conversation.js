var MODE_SEARCH = "MODE_SEARCH";
var MODE_CONSULTANT = "MODE_CONSULTANT";
var MODE_TRAINING = "MODE_TRAINING";

const NOT_FOUND_MSG = "Hic, mình không tìm thấy dữ liệu bạn cần, thử lại với từ khóa khác xem sao nhé!";
// const SEARCH_URL = "https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=10&prop=extracts&exintro&explaintext&exsentences=5&exlimit=max&gsrsearch=";

const SEARCH_URL = "https://fbmsgbot.herokuapp.com/bot/search/?text=";

var model = require('./model.js');
var msg_tem = require('./msg_template.js');

module.exports = {
    MODE_SEARCH: "MODE_SEARCH",
    MODE_CONSULTANT: "MODE_CONSULTANT",
    MODE_TRAINING: "MODE_TRAINING",
    
    createConversation: function(uid, mode){
        return new Conversation(uid, mode);
    },
    
    
};


function Conversation(uid, mode){
    this.uid = uid;
    this.mode = mode;
    if (mode == MODE_CONSULTANT){
        this.server = new Consultant(uid);
    } else if (mode == MODE_TRAINING){
        this.server = new Trainer(uid);
    } else {
        this.server = new Searcher(uid);
    }
    this.toString = function(){
        return uid + "_" + mode;
    };
}

var request = require('request');


function Searcher(uid) {
    this.setMsg = function(msg, callback){
        request(encodeURI(SEARCH_URL + msg.trim()), function(error, response, body){
            if (error) {
              callback(0, NOT_FOUND_MSG);
            }
            try {
                var dataArray = [];
                body = JSON.parse(body);
                var pages = body.pages;
                for (var i = 0 in pages) {
                    var data = {
                        title: pages[i].title,
                        short_description: pages[i].short_description,
                        image_url: pages[i].img_url,
                        url: pages[i].url
                    };
                    dataArray.push(data);
                }
                callback(1, dataArray);
            } catch(err){
              callback(0, NOT_FOUND_MSG);
            }
        });
    };
}

function Consultant(uid){
    this.state = 0;
    this.area = -1;
    this.diseasePointArr = [];
    this.curQuestion = null;
    this.quesIdArr = [];
    this.setMsg = function(msg, callback){
        switch (this.state) {
            case 0:
                callback(2, 0);
                this.state = 1;
                break;
            case 1:
                var pos = parseInt(msg.substring(msg.lastIndexOf("_") + 1), 10);
                if (msg.startsWith(msg_tem.AREA_PAYLOAD_MORE)){
                    callback(2, pos);
                } else if (msg.startsWith(msg_tem.AREA_PAYLOAD)){
                    if (pos < 3){
                        this.area = pos;
                        this.state = 2;
                        callback(0, "Bạn hãy nhập một từ khóa liên quan đến triệu chứng hiện tại của mình!");
                    } else {
                        callback(2, -1);
                    }
                }
                break;
            case 2:
                this.state = 3;
                callback(9, msg);
                this.quesIdArr = [];
                break;
            case 3:
                var hasAnswer = false;
                if (msg.startsWith(msg_tem.ANSWER_YES)){
                    hasAnswer = true;
                } else if (msg.startsWith(msg_tem.ANSWER_NO)){
                    hasAnswer = true;
                } else if (msg.startsWith(msg_tem.ANSWER_SKIP)){
                    hasAnswer = true;
                } else {
                    this.state = 3;
                    callback(9, msg);
                }
                if (hasAnswer){
                    var q_id  = msg.substring(msg.lastIndexOf("_") + 1);  
                    if (this.quesIdArr.indexOf(q_id) < 0){
                        this.quesIdArr.push(q_id);
                    }
                    var findQuestion = true;
                    for (var i = 0 in this.diseasePointArr){
                        if (this.diseasePointArr[i].disease.question.indexOf(q_id) >= 0){
                            if (msg.startsWith(msg_tem.ANSWER_YES)){
                                this.diseasePointArr[i].disease.point += 3;
                                if (findQuestion){
                                    for (var j = 0 in this.diseasePointArr[i].disease.question){
                                        var candiQid = this.diseasePointArr[i].disease.question[j];
                                        if (this.quesIdArr.indexOf(candiQid) < 0){
                                            findQuestion = false;
                                            callback(10, candiQid);
                                        }
                                    }
                                }
                            } 
                        }
                    }
                    for (var i = 0 in this.diseasePointArr){
                        if (this.diseasePointArr[i].disease.question.indexOf(q_id) >= 0){
                            if (msg.startsWith(msg_tem.ANSWER_NO)){
                                this.diseasePointArr[i].disease.point -= 1;
                                if (findQuestion){
                                    for (var j = 0 in this.diseasePointArr[i].disease.question){
                                        var candiQid2 = this.diseasePointArr[i].disease.question[j];
                                        if (this.quesIdArr.indexOf(candiQid2) < 0){
                                            findQuestion = false;
                                            callback(10, candiQid2);
                                        }
                                    }
                                }
                            } 
                        }
                    }
                    var iMax = 0, vMax = 0;
                    for (var i = 0 in this.diseasePointArr){
                        if (this.diseasePointArr[i].point >= vMax){
                            iMax = i;
                            vMax = this.diseasePointArr[i].point;
                        }
                        if (this.diseasePointArr[i].disease.question.indexOf(q_id) >= 0){
                            if (msg.startsWith(msg_tem.ANSWER_SKIP)){
                                if (findQuestion){
                                    for (var j = 0 in this.diseasePointArr[i].disease.question){
                                        var candiQid3 = this.diseasePointArr[i].disease.question[j];
                                        if (this.quesIdArr.indexOf(candiQid3) < 0){
                                            findQuestion = false;
                                            callback(10, candiQid3);
                                        }
                                    }
                                }
                            } 
                        }
                    }
                    if (findQuestion){
                        if (this.diseasePointArr.length == 0){
                            callback(0, "Mình không có thông tin về những căn bệnh phù hợp với triệu chứng của bạn. Bạn hãy thử triệu chứng khác!")
                        } else {
                            callback(0, "Mình thấy " + this.diseasePointArr[iMax].disease.title + " có vẻ phù hợp với các triệu chứng của bạn\n" + this.diseasePointArr[i].disease.short_des);
                        }
                    }
                    console.log(this.diseasePointArr);
                }
                break;
            default:
                // code
        }        
    };
}


function Trainer(uid){
    this.mode = "";
    this.state = 0;
    this.disease = {
        title: "",
        short_des: ""
    };
    this.quest_id = -1;
    this.setMsg = function(msg, callback){
        switch (this.state) {
            case 0:
                callback(3, 0);
                this.state = 1;
                break;
            case 1:
                if (msg === msg_tem.ADD_DISEASE){
                    this.mode = msg;
                    this.state = 2;
                    callback(0, "Nhập tên bệnh:");
                } else if (msg ===  msg_tem.ADD_QUES){
                    this.mode = msg;
                    this.state = 2;
                    callback(0, "Nhập câu hỏi:");
                } else if (msg ===  msg_tem.LINK_QUES){
                    this.mode = msg;
                    this.state = 2;
                    callback(0, "Bạn nhập từ khóa để tìm câu hỏi cần kết nối:");
                }
                break;
            case 2:
                if (this.mode === msg_tem.ADD_DISEASE){
                    this.state = 3;
                    this.disease.title = msg;
                    callback(0, "Nhập mô tả bệnh:");
                } else if (this.mode ===  msg_tem.ADD_QUES){
                    callback(4, msg);
                    callback(0, "Câu hỏi đã được lưu, nhập tiếp câu hỏi mới:");
                } else if (this.mode ===  msg_tem.LINK_QUES){
                    if (msg.startsWith(msg_tem.CHOOSE_LINK_QUES)){
                        this.quest_id = msg.substring(msg.lastIndexOf("_") + 1);
                        this.state = 3;
                        callback(0, "Nhập từ khóa để chọn bệnh kết nối:");
                    } else {
                        this.state = 2;
                        callback(6, msg);
                    }
                }
                break;
            case 3:
                if (this.mode === msg_tem.ADD_DISEASE){
                    this.state = 2;
                    this.disease.short_des = msg;
                    callback(5, this.disease);
                    callback(0, "Bệnh đã được lưu thành công. Mời bạn nhập tên bệnh mới:");
                } else if (this.mode ===  msg_tem.ADD_QUES){
                    
                } else if (this.mode ===  msg_tem.LINK_QUES){
                    if (msg.startsWith(msg_tem.CHOOSE_LINK_DISEASE)){
                        var d_id = msg.substring(msg.lastIndexOf("_") + 1);
                        callback(8, {
                            quest_id: this.quest_id,
                            d_id: d_id
                        });
                        this.state = 2;
                        callback(0, "Đã kết nối, tiếp tục nhập từ khóa để tìm câu hỏi cần kết nối:");
                    } else {
                        this.state = 3;
                        callback(7, msg);
                    }
                }
                break;
            default:
                // code
        }        
    };
}



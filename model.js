var assert = require('assert');

//======================== AREA ====================================
const AREA_COLLECTION = "area_collection";


function Area(name){
    this.name = name;
    this.ranking = 0;
    this.code = 0;
}

var areaInitArrays = [
        new Area("Đa khoa"),
         new Area("Tai mũi họng"),
         new Area("Tiêu hóa"),
         new Area("Tim mạch"),
         new Area("Mắt"),
         new Area("Răng hàm mặt"),
         new Area("Nội tiết"),
         new Area("Truyền nhiễm"),
         new Area("Phụ sản"),
         new Area("Da liễu"),
         new Area("Phổi"),
         new Area("Cơ xương khớp"),
         new Area("Thần kinh"),
         new Area("Chấn thương chỉnh hình"),
         new Area("Dinh dưỡng"),
         new Area("Nhi"),
         new Area("Cấp cứu")
    ];
    
function initArea(){
    for (var i = 0 in areaInitArrays){
        var area = areaInitArrays[i];
        area.code = i;
        area.ranking = i;
    }
}

initArea();
    
// function insertAreaIfNeeded(db, callback){
//     for (var i = 0 in areaInitArrays){
//         var existed = db.collection(AREA_COLLECTION).find( { "name" : areaInitArrays[i].name }).size() > 0;
//         if (!existed){
//             var area = {
//                 "name" : areaInitArrays[i].name,
//                 "ranking": areaInitArrays.length - i
//             };
//             db.collection(AREA_COLLECTION).insertOne(area, function(err, result){
//                 assert.equal(err, null);
//                 // areaInitArrays[i].id = area._id;
//                 console.log("Inserted an area: " + area.name + ": " + area._id);
//             });
            
//         }
//     }
// }






//======================== QUESTION ====================================
const QUESTION_COLLECTION = "question_collection";

function createEmptyQuestion(){
    return {
        "question": "",
        "ranking": 0,
        "rel_ques": [],
        "area": -1
    };
}

function insertQuestionToDB(db, doc, callback) {
    db.collection(QUESTION_COLLECTION).insertOne(doc, function(err, result) {
        assert.equal(err, null);
        // areaInitArrays[i].id = area._id;
        console.log("Inserted an question: " + doc.question + ": " + doc._id);
        callback(doc._id);
    });
}

function getQuestionFromDB(db, id, callback) {
    var cursor = db.collection(QUESTION_COLLECTION).find({ "_id": id }).limit(1);
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      callback(doc);
   });
}

function indexQuestions(db, callback) {
   db.ensureIndex(QUESTION_COLLECTION, {  
      question: "text"
    }, function(err, indexname) {
      assert.equal(err, null);
      console.log(indexname);
    });
}

function searchQuestionFromDB(db, query, callback, array) {
    var cursor = db.collection(QUESTION_COLLECTION).find({$text: {$search: query}}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).limit(3);
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null){
          array.push(doc);
          callback(array, 1);
      } else {
          callback(array, 0);
      }
    });
}

function hashcode(s) {
  var hash = 0, i, chr, len;
  if (s.length === 0) return hash;
  for (i = 0, len = s.length; i < len; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

//======================== DISEASE =========================================
const DISEASE_COLLECTION = "disease_collection";

function createEmptyDisease(){
    return {
        "title": "",
        "short_des": "",
        "question": [],
    };
}

function insertDiseaseToDB(db, doc, callback) {
    db.collection(DISEASE_COLLECTION).insertOne(doc, function(err, result) {
        assert.equal(err, null);
        console.log("Inserted an disease: " + doc.title + ": " + doc._id);
        callback(doc._id);
    });
}

function getDiseaseFromDB(db, id, callback) {
    var cursor = db.collection(DISEASE_COLLECTION).find({ "_id": id }).limit(1);
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      callback(doc);
   });
}

function searchDiseaseFromDB(db, query, callback, array) {
    var cursor = db.collection(DISEASE_COLLECTION).find({$text: {$search: query + ''}}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).limit(5);
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null){
          array.push(doc);
          callback(array, 1);
      } else {
          callback(array, 0);
      }
    });
}

function indexDisease(db, callback) {
    // db.collection(DISEASE_COLLECTION).dropIndex("question_text");
    db.ensureIndex(DISEASE_COLLECTION, { 
      question: "text",
      title: "text",
      short_des: "text"
    }, function(err, indexname) {
      assert.equal(err, null);
      console.log(indexname);
    });
}

function linkQuestion(db, callback, did, questions) {
   db.collection(DISEASE_COLLECTION).updateOne(
      { "_id" : did },
      {
        $set: { "question": questions }
      }, 
      function(err, results) {
          assert.equal(err, null);
          console.log(results);
          callback();
       });
}


module.exports = {
    getAreaArray: function(){
        return areaInitArrays;
    },
    
    createEmptyQuestion: function(){
        return createEmptyQuestion();
    },
    
    createEmptyDisease: function(){
        return createEmptyDisease();
    },
    
    insertQuestionToDB: function(db, doc, callback){
        return insertQuestionToDB(db, doc, callback);
    },

    insertDiseaseToDB: function(db, doc, callback){
        return insertDiseaseToDB(db, doc, callback);
    },
    
    indexDB: function(db, callback){
        indexQuestions(db, callback);
        indexDisease(db, callback);
    },
    
    searchQuestionFromDB: function(db, query, callback, array){
        return searchQuestionFromDB(db, query, callback, array);
    },
    
    searchDiseaseFromDB: function(db, query, callback, array){
        return searchDiseaseFromDB(db, query, callback, array);
    },
    
    getDiseaseFromDB: function(db, id, callback){
        return getDiseaseFromDB(db, id, callback);
    },
    
    linkQuestion: function(db, callback, did, questions){
        return linkQuestion(db, callback, did, questions);
    },
    
    getQuestionFromDB: function (db, id, callback){
        return getQuestionFromDB(db, id, callback);
    }
};
const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema


const courseVideoSchema = new mongoose.Schema({
    title: { type: 'String' },
    url: { type: 'String' }
  });


const courseSchema = new Schema({
    "coursename": { type: 'String' },
    "coursenickname": { type: 'String' },
    "coursetrainer": { type: 'String' },
    "courseduration": { type: 'String'},
    "courseprice": { type: 'String'},
    "courseprereq": { type: ['String'] },
    "coursesamplevideo": { type: 'String'},
    "coursevideourls": { type: ['String'] },
    "coursetype": { type: 'String'},
    "courselogourl":{type: 'String'},
    "coursedescription":{type: 'String'},
    "courseroughtopics": { type: ['String'] },
    "coursecontenttitle": { type: ['String'] },
    "coursevideos": { type: [courseVideoSchema] }
});

var Course = mongoose.model('Course', courseSchema);
module.exports = Course
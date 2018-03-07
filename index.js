const express = require('express');
var formidable = require('formidable');
let app = express();
let PDFParser = require("pdf2json");
let pdfParser = new PDFParser();
let airports = require('airport-codes');


/**
 * description
 * location
 * subject
 * callender
 * start -> new date(YYYY,MM,DD,hh,mm,ss)
 * end   -> new date(YYYY,MM,DD,hh,mm,ss)
 */
function parseData(pdf) {
    const daysKeywords = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const totalKeyword = ['Flight', 'time','Vacation','Sickness','Sum'];
    let period = [];
    let flights  = {};
    let flightTime = 0;
    let sum = 0;

    if(typeof pdf === 'object'){
        let schedule = pdf.formImage.Pages[0].Texts;

        for(let i=0;i<schedule.length;i++){
            // console.log(schedule[i].R[0].T);
            //save period
            if(decodeURIComponent(schedule[i].R[0].T) === 'Period:'){
                period.push(new Date(schedule[i+1].R[0].T).getTime());
                period.push(new Date(schedule[i+3].R[0].T).getTime());
            }

            if (daysKeywords.indexOf((schedule[i].R[0].T).substring(0, 3)) > -1 && (schedule[i].R[0].T).length == 5) {
              let dayInMonth = parseInt((schedule[i].R[0].T).substring(3,5));

              flights[dayInMonth] = [];
              let oneDayInArray = [];
              for (var j = i+1; j < schedule.length; j++) {
                  if (daysKeywords.indexOf((schedule[j].R[0].T).substring(0, 3)) > -1 && (schedule[j].R[0].T).length == 5) {//Next Day
                      if (oneDayInArray.length > 0) {
                          flights[dayInMonth] = oneDayInArray;
                      }
                      i=j-1;
                      break;
                  }
                  oneDayInArray.push(decodeURIComponent(schedule[j].R[0].T));
              }
            }
            if (schedule[i].R[0].T === 'Flight' && schedule[i+1].R[0].T === 'time') {
                flightTime = decodeURIComponent(schedule[i+2].R[0].T);
            }
            if (schedule[i].R[0].T === 'Sum' && schedule[i+1].R[0].T != '(net)') {
                sum = decodeURIComponent(schedule[i+1].R[0].T);
            }
        }
    }

    return {
        period,
        flights,
        flightTime,
        sum
    };
}


function getParsedSchedule(file,res){
  console.log("4");
  try {
    pdfParser.on("pdfParser_dataError", errData => console.error("Error",errData.parserError) );
    pdfParser.on("pdfParser_dataReady", pdfData => {
        console.log("6");
        let schedule =  parseData(pdfData);
        let obj  = JSON.stringify(schedule);
        // res.setHeader("Content-Type",'application/json');
        console.log(res.headersSent);
        if (!res.headersSent) {
            res.status(200).json(obj);
        }

    });
    console.log("5");
    pdfParser.loadPDF(file.path);
  } catch (e) {
    console.log(e);
  }

}
app.post('/', function (req, res){
    let form = new formidable.IncomingForm();
    form.parse(req);
    console.log("1");
    form.on('fileBegin', function (name, file){
      console.log("2");
        if (file.type === 'application/pdf') {
            file.path = __dirname + '/uploads/' + file.name;
        }
    });

    form.on('file', function (name, file){
      console.log("3");
      console.log(name,file);
        if (file.size > 0) {
            getParsedSchedule(file,res);
            // res.send(fullObject);
        }
    });

    // res.sendFile(__dirname + '/index.html');
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
})

app.listen(3030);

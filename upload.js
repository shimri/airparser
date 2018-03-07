let express = require('express')
let path = require('path')
let multer  = require('multer')
let PDFParser = require("pdf2json");
let pdfParser = new PDFParser();
let storage = multer.diskStorage({
  destination: __dirname+'/uploads',
  filename: (req,file,cb)=>{
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

let upload = multer({ storage: storage }).single('avatar')
let app = express()

app.post('/',(req, res, next) => {
  upload(req, res, (err) =>{
    if (err) {
      console.log(err);
    }else{
      pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
      pdfParser.on("pdfParser_dataReady", pdfData => {
        console.log(JSON.stringify(pdfData));
      });

      pdfParser.loadPDF(req.file.path);
      res.send('test')
    }
  })
})

app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/index.html');
})

app.listen(4000);

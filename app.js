import express from 'express'
import bodyParser from 'body-parser'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const app = express();
const port = process.env.port || 3000;

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

app.set('view engine', 'ejs')
app.set('views', './views')

const MongoClient = require('mongodb').MongoClient
const mongoUrl = 'mongodb://127.0.0.1:27017'
const dbName = 'db_edureka'
const collectionName = 'buglist'
let db

const ObjectId = require('mongodb').ObjectID

app.post('/addBug', (req,res)=>{
    const rec = req.body
    rec["createTime"] = Date.now()
    rec["closeTime"] = ''
   

    db.collection(collectionName).insertOne(rec)
        .then( result => {
            res.redirect("/")
        })
        .catch(err => {
            console.error(`Error Message : ${err}`)
            res.status(500).send(`Error Message : ${err}`)
        })
    
})


app.get('/', (req,res)=>{
    db.collection(collectionName).find().toArray((err, result)=>{
        if(err) throw err
        let status
        const bugs = result.map( bug =>{
            console.log("bug ==> ", bug)
            const slaTime = bug.createTime + 259200000

            if( bug.closeTime.length == '' ) {
                status = "OPEN"
            } else {
                status = "CLOSE"
                bug["closeTimeStr"] = new Date(bug.closeTime).toLocaleString()
            }
            bug["createTimeStr"] = new Date(bug.createTime).toLocaleString()
            bug["slaTimeStr"] = new Date(slaTime).toLocaleString()
            bug["status"] = status
            return bug
        })
        res.render('index.ejs', {data:bugs})
    })
})

app.get('/deleteBug/:id', (req,res)=>{
    const id = req.params.id
    console.log("delete id ==> ", id)

    db.collection(collectionName).findOneAndDelete({
        _id: ObjectId(id)
    }, (err,result)=>{
        if(err) return res.send(500,err)
        res.redirect('/')
        console.log("deleteBug result ==> ", result)
    })

})

app.get('/closeBug/:id', (req,res)=>{
    const id = req.params.id
    console.log("id ==> ", id)
    
    db.collection(collectionName).findOne( {_id: ObjectId(id)} )
        .then(result =>{
            db.collection(collectionName)
                .findOneAndUpdate({_id: ObjectId(result._id)},{
                    $set:{
                        title : result.title,
                        assignee : result.assignee,
                        description : result.description,
                        createTime : result.createTime,
                        closeTime: Date.now(),
                    }
                },{
                    upsert: true
                }, (err,result)=>{
                    if(err) return res.send(err)
                    res.redirect('/')
                })
        })
        .catch( err => console.error(`Error : ${err}`))

})

MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err,client)=>{
    if(err) throw err
    db = client.db(dbName)
    app.listen(port, ()=>{
        console.log(`Express Server running on port ${port}`)
    })
})


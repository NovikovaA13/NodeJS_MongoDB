import express from 'express';
import fs from 'fs';
import constants from 'fs';
import __dirname from './__dirname.js';
import bodyParser from "body-parser";
import expressSession from 'express-session';
import expressHandlebars from 'express-handlebars';
import mongodb from 'mongodb';
import {ObjectId} from 'mongodb';

const handlebars = expressHandlebars.create({
	defaultLayout: 'main', 
	extname: 'hbs',
	helpers: {
		getFunc: function(href, text, witdh){
			return '<img src="' + href + '" alt="'+ text + '" width=' + witdh + '>';
		}
	}
});
let app = express();

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));


let mongoClient = new mongodb.MongoClient('mongodb://localhost:27017/', {
	useUnifiedTopology: true
});
mongoClient.connect(async function (error, mongo){
	if(error){
		console.log('error ' + error);
	}else{
		let db = mongo.db('test');
		let coll = db.collection('prods');

		app.get('/prods', async function(req, res) {
			let prods = await coll.find().toArray();
			res.render('showAll', {'prods': prods});

		});
		app.get('/prod/add', async function(req, res){
			res.render('add');
		});

		app.post('/prod/add', async function(req, res){
			let body = req.body;
			await coll.insertOne({
				'name': body.name,
				'cost': body.cost,
				'rest': body.rest,
			});
			let prods = await coll.find().toArray();
			res.render('showAll', {
				'flushMessage' : 'Le produit ' + body.name + ' a bien été ajouté.',
				'prods': prods
			});
		});

		app.get('/prod/edit/:id', async function (req, res) {
			let oldId = new ObjectId(req.params.id);
			let prod = await coll.findOne({'_id': oldId});
			if(prod){
				res.render('edit', {'prod': prod});
			}else{
				res.status(404).render('404');
			}

		});
		app.post('/prod/edit', async function (req, res) {
			let body = req.body;
			let oldId = new ObjectId(body._id);
			let prod = await coll.findOne({'_id': oldId});
			if(prod){
				await coll.updateOne({'_id': oldId}, {$set: {
					'name': body.name,
					'cost': body.cost,
					'rest': body.rest
					}});
				let prods = await coll.find().toArray();
				res.render('showAll', {
					'prods': prods,
					'flushMessage': 'Le produit ' + body.name + ' a été bien modifié.'
				});
			}else{
				res.status(404).render('404');
			}

		});
		app.get('/prod/delete/:id', async function (req, res){
			let oldId = new ObjectId(req.params.id);
			let message;
			let result = await coll.findOneAndDelete({_id: oldId});
			if(result.value){
				let nameProdDeleted = result.value.name;
				message = 'La suppression d\'un produit ' + nameProdDeleted + ' a été bien effectuée.';
			}else {
				message = 'Ce produit n\'existe pas.';
			}
			let prods = await coll.find().toArray();
			res.render('showAll', {
				'flushMessage' : message,
				'prods': prods
			});
		});
		app.get('/prod/:id', async function (req, res) {
			let oldId = new ObjectId(req.params.id);
			let prod = await coll.findOne({_id : oldId});
			res.render('showOne', {'prod': prod});
		});


		app.use(function(req, res){
			res.status(404).render('404');
		});

		app.listen(3000, function(){
			console.log('Server is running at http://localhost:3000/prods');
		});
	}
});



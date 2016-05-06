
var models = require('../models');
var Sequelize = require('sequelize');

// Autoload el quiz asociado a :quizId
exports.load = function(req, res, next, quizId) {
	models.Quiz.findById(quizId)
  		.then(function(quiz) {
      		if (quiz) {
        		req.quiz = quiz;
        		next();
      		} else {
      			next(new Error('No existe quizId=' + quizId));
      		}
        })
        .catch(function(error) { next(error); });
};


// GET /quizzes.:format?
exports.index = function(req, res, next) {
	var srch = req.query.search;

	if (srch == undefined) {
		// no se ha definido ninguna búsqueda
		srch = '%';
	}
	else {
		// búsqueda de quizes
		srch = '%'+srch+'%';
		srch = srch.replace(/ /g, '%');
	}

	console.log(srch);
	models.Quiz.findAll({
		where: {
			question: {
				$like: srch
			}
		}
	})
		.then(function(quizzes) {
			if (req.params.format == undefined || req.params.format == "html")
				res.render('quizzes/index.ejs', { quizzes: quizzes});
			else if (req.params.format == "json") {
				var data = [];
				for (i=0; i < quizzes.length; i++) {
					data.push({ "id": quizzes[i].id,
											"question": quizzes[i].question,
											"answer": quizzes[i].answer,
											"createdAt": quizzes[i].createdAt,
											"updatedAt": quizzes[i].updatedAt});
				}
				res.json(data);
			}
			else {
				next(res.error);
			}
		})
		.catch(function(error) {
			next(error);
		});
};


// GET /quizzes/:id.:format?
exports.show = function(req, res, next) {

	var answer = req.query.answer || '';

	if (req.params.format == undefined || req.params.format == "html")
		res.render('quizzes/show', {quiz: req.quiz, answer: answer})
	else if (req.params.format == "json") {
		res.json({ "id": req.quiz.id,
								"question": req.quiz.question,
								"answer": req.quiz.answer,
								"createdAt": req.quiz.createdAt,
								"updatedAt": req.quiz.updatedAt});
	}
	else {
		next(res.error);
	}
};


// GET /quizzes/:id/check
exports.check = function(req, res, next) {

	var answer = req.query.answer || "";

	var result = answer === req.quiz.answer ? 'Correcta' : 'Incorrecta';

	res.render('quizzes/result', { quiz: req.quiz,
								   result: result,
								   answer: answer });
};

// GET /quizzes/new
exports.new = function(req, res, next) {
  var quiz = models.Quiz.build({question: "", answer: ""});
  res.render('quizzes/new', {quiz: quiz});
};

// POST /quizzes/create
exports.create = function(req, res, next) {
  var quiz = models.Quiz.build({ question: req.body.quiz.question,
  	                             answer:   req.body.quiz.answer} );

  // guarda en DB los campos pregunta y respuesta de quiz
  quiz.save({fields: ["question", "answer"]})
  	.then(function(quiz) {
		req.flash('success', 'Quiz creado con éxito.');
    	res.redirect('/quizzes');  // res.redirect: Redirección HTTP a lista de preguntas
    })
    .catch(Sequelize.ValidationError, function(error) {

      req.flash('error', 'Errores en el formulario:');
      for (var i in error.errors) {
          req.flash('error', error.errors[i].value);
      };

      res.render('quizzes/new', {quiz: quiz});
    })
    .catch(function(error) {
		req.flash('error', 'Error al crear un Quiz: '+error.message);
		next(error);
	});
};

// GET /quizzes/:id/edit
exports.edit = function(req, res, next) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizzes/edit', {quiz: quiz});
};


// PUT /quizzes/:id
exports.update = function(req, res, next) {

  req.quiz.question = req.body.quiz.question;
  req.quiz.answer   = req.body.quiz.answer;

  req.quiz.save({fields: ["question", "answer"]})
    .then(function(quiz) {
	  req.flash('success', 'Quiz editado con éxito.');
      res.redirect('/quizzes'); // Redirección HTTP a lista de preguntas.
    })
    .catch(Sequelize.ValidationError, function(error) {

      req.flash('error', 'Errores en el formulario:');
      for (var i in error.errors) {
          req.flash('error', error.errors[i].value);
      };

      res.render('quizzes/edit', {quiz: req.quiz});
    })
    .catch(function(error) {
	  req.flash('error', 'Error al editar el Quiz: '+error.message);
      next(error);
    });
};

// DELETE /quizzes/:id
exports.destroy = function(req, res, next) {
  req.quiz.destroy()
    .then( function() {
	  req.flash('success', 'Quiz borrado con éxito.');
      res.redirect('/quizzes');
    })
    .catch(function(error){
	  req.flash('error', 'Error al editar el Quiz: '+error.message);
      next(error);
    });
};

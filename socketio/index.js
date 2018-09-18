'use strict';

const
	io = require('socket.io')(),
	onlineconsult = require('./onlineconsult'),
	chatenquiry = require('./chatenquiry'),
	models = require('../models');

io.use((socket, next) => {
	socket.handshake.headers.token = socket.handshake.headers.token ||
		socket.handshake.query.token;
	if (!socket.handshake.headers.token) {
		socket.user = null;
		next();
	} else {
		models.oauthaccesstoken.belongsTo(models.user, {foreignKey: 'user_id'});
		models.oauthaccesstoken.findOne({
			where: {access_token: socket.handshake.headers.token},
			attributes: ['access_token'],
			include: [{model: models.user, attributes: ['id', 'user_type']}]
		})
		.then(oauthaccesstoken => {
			socket.request.user = (oauthaccesstoken && oauthaccesstoken.user) || null;
			next();
		})
		.catch(console.log);
	}
});

function getTime(cb) {
	if (! cb) return;
	models.sequelize.query('SELECT CURRENT_TIMESTAMP', {type: models.sequelize.QueryTypes.SELECT})
	.then(results => cb({
		time: Date.parse(results[0].CURRENT_TIMESTAMP),
		status: true
	}))
	.catch(cb);
}

io.on('connection', socket => {
	socket.on('get-time', getTime);
});
io.of('onlineconsult').use(onlineconsult);
io.of('chatenquiry').use(chatenquiry);

module.exports = function (server) {
	io.attach(server, {pingTimeout: 30000 , pingInterval: 25000});
};
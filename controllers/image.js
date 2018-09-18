const
	fs = require('fs'),
	mv = require('mv'),
	util = require('util'),
	path = require('path'),
	crypto = require('crypto'),
	tmpdir = require('os').tmpdir(),
	child_process = require('child_process'),
	sharp = require('sharp');
const models = require('../models');

const
	iconImages = [
		'public/uploads/icon/id.png',
		'public/uploads/icon/male.png',
		'public/uploads/icon/user.png',
		'public/uploads/icon/user.jpeg',
		'public/uploads/icon/female.png',
		'public/uploads/icon/institute.png',
		'public/uploads/icon/vehicle-logo.png',
		'public/uploads/icon/no-image-available.png',
	];

const rename = util.promisify(mv);
const exec = util.promisify(child_process.exec);

async function optimize (file, resize) {
	let ext = path.extname(file).toLowerCase().substring(1);
	if (/(?:jpg|png|jpeg)$/.test(ext)) {
		optimizeImage(file, resize);
	}
}

function optimizeImage(file, resize) {
	let ext = path.extname(file).toLowerCase();
	let tmpFile = path.join(
		tmpdir,
		'pateast_temp_files' +
			Date.now().toString(16) + 
			crypto.randomBytes(4).toString('hex') + ext,
	);
	new Promise((resolve, reject) => {
		fs.access(file, fs.constants.R_OK, err => {
			if (err) {
				reject(err);
			} else {
				resolve(sharp(file));
			}
		});
	})
		.then(image => resize ? resizeImage(image) : image)
		.then(image => {
			if (ext === '.jpg' || ext === '.jpeg') {
				return image.jpeg();
			} else {
				return image.png({compressionLevel: 9});
			}
		})
		.then(image => image.toFile(tmpFile))
		.then(() => new Promise((resolve, reject) => {
			mv(tmpFile, file, err => {
				if (err) {
					reject(err);
				} else {
					resolve(true);
				}
			});
		})).catch(console.log);
}

async function convertVideo(file, newFile, fieldName = null) {
	//' -f mp4 -vcodec libx264 -acodec aac -strict -2 ' +
	await exec(
		'ffmpeg -i ' + 
		JSON.stringify(file) + 
		' -f webm -c:v libvpx -b:v 1M -acodec libvorbis ' +
		JSON.stringify(newFile), {
			cwd: process.cwd(),
		}
	);

	if(fieldName !== null) {
		let utils = require('./utils'); let modelTo;
		fieldName === "doctor_files" && (modelTo = 'doctorfile');
		fieldName === "hospital_files" && (modelTo = 'hospitalfile');

		utils.updateVideoFile({file, newFile, modelTo}, () => newFile)
	} else {
		return newFile;
	}
}

async function moveFile(file, fieldName = null) {
	let newFile = path.join('public/uploads', file.substring(tmpDir.length));
	await createDir(path.dirname(newFile));
	let ext = path.extname(file).toLowerCase().substring(1);
	if (/(?:3gp|mp4|avi|wmv|mov|m4v|ogx)$/.test(ext)) {
		newFile = newFile.substring(0, newFile.lastIndexOf(ext)) + 'webm';
		convertVideo(file, newFile, fieldName);
		return file;
	} else {
		await rename(file, newFile);
	}
	return newFile;
}

function resizeImage(image) {
	return image.metadata().then(meta => {
		if (meta.width > 300 || meta.height > 180) {
			return image.resize(300, 180).max();
		}
		return image;
	});
}

module.exports.makeOptimizerHook = function (fieldname, resize) {
	return async instance => {
		let value = instance[fieldname], lastValue = instance.previous(fieldname);
		if (value === lastValue) return;
		if (lastValue && iconImages.indexOf(lastValue) === -1) {
			fs.unlink(lastValue, () => 0);
		}
		if (value && value.startsWith(tmpDir)) {
			instance[fieldname] = await moveFile(value);
			optimize(instance[fieldname], resize);
		} else if((fieldname === 'doctor_files' || fieldname === 'hospital_files') && instance['file_type'] === 'video') {
			instance[fieldname] = await moveFile(value, fieldname);
			optimize(instance[fieldname], resize);
		} else if (value) {
			optimize(value, resize);
		}
	};
};

module.exports.makeOptimizerHookForChat = function (fieldname, resize) {
	return async instance => {
		let value = instance[fieldname], lastValue = instance.previous(fieldname);
		if (value === lastValue) return;
		if (lastValue && iconImages.indexOf(lastValue) === -1) {
			fs.unlink(lastValue, () => 0);
		}
		if (value && value.startsWith(tmpDir)) {
			instance[fieldname] = await moveFile(value);
			optimize(instance[fieldname], resize);
		} else if (value) {
			optimize(value, resize);
		}
	};
};

function createDir(dirpath) {
	if (!dirpath || dirpath === '.' || dirpath === '/') return Promise.resolve(true);
	return new Promise((resolve, reject) => {
		fs.access(dirpath, fs.constants.R_OK, err => {
			if (err) {
				createDir(path.dirname(dirpath))
					.then(() => fs.mkdir(dirpath, err => {
						if (err && err.code !== 'EEXIST') {
							reject(err);
						} else {
							resolve(true);
						}
					})).catch(reject);
			} else {
				resolve(true);
			}
		});
	});
}
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');
const http = require('http');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const mailTransport = nodemailer.createTransport(smtpTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
}));

admin.initializeApp();

//Webhook
function webhook(url) {
	const client = (url.indexOf("https://") === 0) ? https : http;
	client.get(url);
}

//Email
function email(to, subject, text) {
	//check if email address is unsubscribed
	admin.database().ref('unsubscribed').child(to.replace(/\./g, ',')).once("value",snapshot => {
		if (!snapshot.exists()) {
			//add footer
			const footer = "<br/> Didn't subscribe to these emails? <a href='https://platform.openiot.xyz/unsubscribe/" + to + "'>Unsubcribe</a>.";
			//create options
			const emailOptions = {
				from: '"OpenIoT" <' + functions.config().gmail.email + '>',
				to: to,
				subject: subject,
				html: text + footer
			};
			//send email
			try {
				mailTransport.sendMail(emailOptions);
			} catch(error) {
				console.error('There was an error while sending the email:', error);
			}
		}
		else {
			console.log("Email unsubscribed");
		}
	});
}

//Validate emil address
function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(String(email).toLowerCase());
}

//GPIO listener
exports.portsListener = functions.database.ref('things/{thingID}/ports/{portID}').onUpdate((change, context) => {
	//get port data
	const port = change.after.val();
	//update logs
	let now = Math.floor(Date.now() / 1000);
	if (now - port.lastActivity > 600 || typeof port.lastActivity === "undefined") {
		change.after.ref.child("lastActivity").set(now);
		admin.database().ref('logs/'+context.params.thingID+'/'+port.name+'/'+now).set(port.value);
	}
	//set notifications reference
	const notificationsRef = admin.database().ref('things/'+context.params.thingID+'/notifications');
	//read associated notifications
	return notificationsRef.orderByChild("triggerValue").equalTo(context.params.portID).once("value",notificationsSnap => {
		//loop through notifications
		notificationsSnap.forEach(notificationSnap => {
			const notification = notificationSnap.val();
			//check that at least 10 minutes have passed since last activity
			if (notification.lastActivity > now + 600) return null;
			// update last activity
			notificationsRef.child(notificationSnap.key).child("lastActivity").set(now);
			//fire email
			if (notification.action === "email") {
				email(notification.actionValue, "OpenIoT - '" + notification.name + "' fired!", "Your notification (" + notification.name + ") has just fired! It means that port " + port.name + " has just changed its state.");
			}
			//fire webhook
			else {					
				webhook(notification.actionValue);
			}
				return true;
		});
		return true;
	});
});

//Notification for variables
exports.variablesListener = functions.database.ref('things/{thingID}/variables/{name}').onUpdate((change, context) => {
	//read value
	const variable = change.after.val();
	//update logs
	let now = Math.floor(Date.now() / 1000);
	if (now - variable.lastActivity > 600 || typeof variable.lastActivity === "undefined") {
		change.after.ref.child("lastActivity").set(now);
		admin.database().ref('logs/'+context.params.thingID+'/'+context.params.name+'/'+now).set(variable.value);
	}
	//set ref
	const notificationsRef = admin.database().ref('things/'+context.params.thingID+'/notifications');
	//read associated notifications
	return notificationsRef.orderByChild("triggerValue").equalTo(context.params.name).once("value",notificationsSnap => {
		//loop through notifications
		notificationsSnap.forEach(notificationSnap => {
			const notification = notificationSnap.val();
			//check that at least 10 minutes have passed since last activity
			if (notification.lastActivity > now + 600) return null;
			//test criteria
			let result = false;
			let state = "";
			switch (notification.triggerOperation) {
				case "changed":
					result = true;
					state = "changed to " + variable.value;
					break;
					
				case "<":
					if (notification.lastStatus === 0 && parseFloat(variable.value) < parseFloat(notification.triggerOperationValue)) {
						result = true;
						state = "smaller than " + notification.triggerOperationValue + " (" + variable.value + ")";
						notificationsRef.child(notificationSnap.key).child("lastStatus").set(1);
					}
					else if (notification.lastStatus === 1 && parseFloat(variable.value) >= parseFloat(notification.triggerOperationValue)) {
						notificationsRef.child(notificationSnap.key).child("lastStatus").set(0);
					}
					break;
					
				case ">":
					if (notification.lastStatus === 0 && parseFloat(variable.value) > parseFloat(notification.triggerOperationValue)) {
						result = true;
						state = "greater than " + notification.triggerOperationValue + " (" + variable.value + ")";
						notificationsRef.child(notificationSnap.key).child("lastStatus").set(1);
					}
					else if (notification.lastStatus === 1 && parseFloat(variable.value) <= parseFloat(notification.triggerOperationValue)) {
						notificationsRef.child(notificationSnap.key).child("lastStatus").set(0);
					}
					break;
					
				case "=":
					if (parseFloat(variable.value) === parseFloat(notification.triggerOperationValue)) {
						state = "equal to " + notification.triggerOperationValue;
						result = true;
					}
					break;
			}
			if (result) {
				//update last activity
				notificationsRef.child(notificationSnap.key).child("lastActivity").set(now);
				//fire email
				if (notification.action === "email") {
					email(notification.actionValue, "OpenIoT - '" + notification.name + "' fired!", "Your notification (" + notification.name + ") has just fired! It means that variable " + context.params.name + " is now " + state + ".");
				}
				//fire webhook
				else {					
					webhook(notification.actionValue);
				}
			}
			return null;
		});
	});
});

//Notification for offline / online
exports.statusListener = functions.database.ref('things/{thingID}/status').onUpdate((change, context) => {
	//set status
	const value = change.after.val();
	let status;
	switch (value) {
		case 0:
			status = "OFFLINE";
			break;
			
		case 1:
			status = "ONLINE";
			break;
	}
	//set ref
	const notificationsRef = admin.database().ref('things/'+context.params.thingID+'/notifications');
	//read associated notifications
	return notificationsRef.orderByChild("trigger").equalTo(status).once("value",notificationsSnap => {
		//loop through notifications
		notificationsSnap.forEach(notificationSnap => {
			const notification = notificationSnap.val();
			//check that at least 10 minutes have passed since last activity
			if (notification.lastActivity > Date.now()/1000 + 600) return true;
			// update last activity
			notificationsRef.child(notificationSnap.key).child("lastActivity").set(Math.round(Date.now()/1000));
			//fire email
			if (notification.action === "email") {
				email(notification.actionValue, "OpenIoT - '" + notification.name + "' fired!", "Your notification " + notification.name + " has just fired! It means that your thing is now " + status);
			}
			//fire webhook
			else {					
				webhook(notification.actionValue);
			}
			return true;
		});
		return true;
	});
});

//Notification for restart
exports.restartListener = functions.database.ref('things/{thingID}/lastRestart').onUpdate((change, context) => {
	//set ref
	const notificationsRef = admin.database().ref('things/'+context.params.thingID+'/notifications');
	//read associated notifications
	return notificationsRef.orderByChild("trigger").equalTo("RESTART").once("value",notificationsSnap => {
		//loop through notifications
		notificationsSnap.forEach(notificationSnap => {
			const notification = notificationSnap.val();
			//check that at least 10 minutes have passed since last activity
			if (notification.lastActivity > Date.now()/1000 + 600) return null;
			// update last activity
			notificationsRef.child(notificationSnap.key).child("lastActivity").set(Math.round(Date.now()/1000));
			//fire email
			if (notification.action === "email") {
				email(notification.actionValue, "OpenIoT - '" + notification.name + "' fired!", "Your notification " + notification.name + " has just fired! It means that your thing has just restarted.");
			}
			//fire webhook
			else {					
				webhook(notification.actionValue);
			}
			return true;
		});
	});
});

//Send reset password link
exports.forgotListener = functions.database.ref('users/{userID}/reset/token').onUpdate((change, context) => {
	const token = change.after.val();
	const url = functions.config().public.url + "reset/" + context.params.userID + "/" + token;
	//get user's email
	return change.after.ref.parent.parent.child("email").once("value", nameSnap => {
		const emailAddress = nameSnap.val();
		//send email
		email(emailAddress, "OpenIoT - reset password", "You requested to reset your password for OpenIoT. If it weren't you then just ignore this email. If it were, then you can set a new password <a href='"+url+"'>here</a>.");
		return null;
	});
	
});

//Block IP address after 5 failed login attempts within 5 minutes timespan
exports.loginSecurity = functions.database.ref('loginLogs/{ID}').onCreate((snapshot, context) => {
	const log = snapshot.val();
	//dismiss if it's a successful log in
	if (log.status) return true;
	//store timestamp
	const now = Math.round(Date.now()/1000);
	//loop through last failed attempts from same IP address
	return snapshot.ref.parent.orderByChild("ip").equalTo(log.ip).once("value",logsSnap => {
		let i = 0;
		logsSnap.forEach(logSnap => {
			const logVal = logSnap.val();
			//add to counter if the date fits and the status is false
			if (!logVal.status && logVal.date > now - 60 * 5) {
				i++;
			}
		});
		//if we have more than 4 failed attemps then block ip
		if (i >= 5) {
			admin.database().ref('banIP').push({date: now, ip: log.ip});
		}
		return true;
	});
});


//Unsubcribe
exports.unsubscribe = functions.https.onRequest((req,res) => {
	if (validateEmail(req.query.email)) {
		console.log("vadlidated");
		admin.database().ref('unsubscribed/' + req.query.email.replace(/\./g, ',')).set(true);
		res.redirect(functions.config().unsubscribed.url);
	}
});
var Tail = require('tail').Tail,
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport');

function missingConfig(field) {
  console.log("Missing " + field + " environment variable.");
  process.exit(1);
}

var eventLog = process.env.EVENT_LOG || "events.log";
var alertEmail = process.env.ALERT_EMAIL || missingConfig('ALERT_EMAIL');
var sourceEmail = process.env.SOURCE_EMAIL || missingConfig('SOURCE_EMAIL');
var smtpHost = process.env.SMTP_HOST || missingConfig('SMTP_HOST');
var smtpPort = process.env.SMTP_PORT || missingConfig('SMTP_PORT');
var smtpUser = process.env.SMTP_USER || sourceEmail;
var smtpPass = process.env.SMTP_PASS || missingConfig('SMTP_PASS');

var transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  maxConnections: 5,
  maxMessages: 10
});

tail = new Tail(eventLog);

tail.on("line", function(data) {
  try {
    obj = JSON.parse(data);
  } catch (e) {
    console.log(e);
    obj = {}
  }
  if (obj.msg_text && obj.msg_title) {
    if (obj.msg_text.indexOf('@' + alertEmail) > -1) {
      var mailOptions = {
        from: 'DD-House Alert <' + sourceEmail + '>',
        to: alertEmail,
        subject: obj.msg_title,
        text: obj.msg_text,
        html: '<h2>' + obj.msg_title + '</h2><p>' + obj.msg_text + '</p>'
      };
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Message sent: ' + info.response);
        }
      });
    } else {
      console.log("Not sending alert: " + data);
    }
  } else {
    console.log("Unknown event: " + data);
  }
});

export const EMAIL_CONTENT_COLLECTION = 'email_content';
export const ERP_BOOTSTRAP_TAG = 'email_content';

export const licenseExpirationNotificationKey = 'license_expiration_notification';
export const contractExpirationNotificationKey = 'contract_expiration_notification';

export const contractExpirationNotifications = [
  {
    languageCode: 'en-US',
    subject: 'Contract Expiration Reminder – Action Required',
    value:
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">' +
      '<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Contract Expiration Reminder</h1>' +
      '</div>' +
      '<div style="background: #f8f9fa; padding: 32px 24px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #212529;">Dear Franchise Admin,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #212529;">This is a reminder that a contract is approaching its expiration date.</p>' +
      '<div style="background: #ffffff; border-left: 4px solid #667eea; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<table style="width: 100%; border-collapse: collapse;">' +
      '<tr>' +
      '<td style="padding: 8px 0; font-weight: 600; color: #495057; width: 140px;">Contract ID:</td>' +
      '<td style="padding: 8px 0; color: #212529;"><strong>${CONTRACT_ID}</strong></td>' +
      '</tr>' +
      '<tr>' +
      '<td style="padding: 8px 0; font-weight: 600; color: #495057;">Party:</td>' +
      '<td style="padding: 8px 0; color: #212529;"><strong>${PARTNER_NAME}</strong></td>' +
      '</tr>' +
      '<tr>' +
      '<td style="padding: 8px 0; font-weight: 600; color: #495057;">Expiration Date:</td>' +
      '<td style="padding: 8px 0; color: #212529;"><strong>${EXPIRATION_DATE}</strong></td>' +
      '</tr>' +
      '</table>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.6; color: #212529; font-weight: 600;">Please take the necessary steps to renew or extend the contract before the expiration date.</p>' +
      '<hr style="border: none; border-top: 1px solid #dee2e6; margin: 32px 0 24px 0;">' +
      '<p style="margin: 0; font-size: 14px; color: #6c757d; line-height: 1.5;">Thank you for your attention.</p>' +
      '</div>' +
      '</div>',
  },
  {
    languageCode: 'de-DE',
    subject: 'Vertragsablauf – Erinnerung',
    value:
      '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">' +
      '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">' +
      '<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Vertragsablauf – Erinnerung</h1>' +
      '</div>' +
      '<div style="background: #f8f9fa; padding: 32px 24px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #212529;">Sehr geehrte/r Franchise-Administrator/in,</p>' +
      '<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #212529;">Dies ist eine Erinnerung, dass ein Vertrag demnächst abläuft.</p>' +
      '<div style="background: #ffffff; border-left: 4px solid #667eea; padding: 20px; margin: 24px 0; border-radius: 4px;">' +
      '<table style="width: 100%; border-collapse: collapse;">' +
      '<tr>' +
      '<td style="padding: 8px 0; font-weight: 600; color: #495057; width: 140px;">Vertrags-ID:</td>' +
      '<td style="padding: 8px 0; color: #212529;"><strong>${CONTRACT_ID}</strong></td>' +
      '</tr>' +
      '<tr>' +
      '<td style="padding: 8px 0; font-weight: 600; color: #495057;">Partei:</td>' +
      '<td style="padding: 8px 0; color: #212529;"><strong>${PARTNER_NAME}</strong></td>' +
      '</tr>' +
      '<tr>' +
      '<td style="padding: 8px 0; font-weight: 600; color: #495057;">Ablaufdatum:</td>' +
      '<td style="padding: 8px 0; color: #212529;"><strong>${EXPIRATION_DATE}</strong></td>' +
      '</tr>' +
      '</table>' +
      '</div>' +
      '<p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.6; color: #212529; font-weight: 600;">Bitte unternehmen Sie die erforderlichen Schritte zur Verlängerung oder Erweiterung des Vertrags vor Ablaufdatum.</p>' +
      '<hr style="border: none; border-top: 1px solid #dee2e6; margin: 32px 0 24px 0;">' +
      '<p style="margin: 0; font-size: 14px; color: #6c757d; line-height: 1.5;">Vielen Dank für Ihre Aufmerksamkeit.</p>' +
      '</div>' +
      '</div>',
  },
];

export const licenseExpirationNotifications = [
  {
    languageCode: 'en-US',
    subject: 'Your License is About to Expire',
    value:
      '<table border="0" width="100%" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td align="center">\r\n<table border="0" width="600" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td>\r\n<p><img style="width: 100%; max-width: 800px; height: auto; display: block;" src="https://development.perfektauto.at/assets/329fcce0-3ab8-4274-b070-0e73a44ea42d.png" alt="Email Header Final" width="800"></p>\r\n<h3>Dear ${FIRST_NAME} ${LAST_NAME},</h3>\r\n<p>We would like to inform you that your category ${CATEGORY} driving license will expire on ${EXPIRATION_DATE}.</p>\r\n<p><h3>Please renew it.</h3></p>\r\n<hr style="border: none; height: 1px; background-color: #add0b6; color: #add0b6;">\r\n<p>Thank you for your work! ✨</p>\r\n<p style="text-align: left; font-size: 16px;"><strong> <img style="height: 2em; vertical-align: middle; margin-right: 4px;" src="https://development.perfektauto.at/assets/4b82c1c2-49b0-4911-8e82-de600e5b500a.png" alt="Logo"> PerfektAuto Team</strong></p>\r\n<div style="height: 12px; line-height: 12px;">&nbsp;</div>\r\n<table style="background-image: url(\'https://development.perfektauto.at/assets/6ef7b7f1-129d-4dd0-9934-b7f8db5b25d2.png?width=1600&amp;height=374\'); background-repeat: no-repeat; background-size: cover; padding: 20px 0;" border="0" width="100%" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td align="center">\r\n<table style="font-family: Arial, sans-serif; color: #ffffff;" border="0" width="600" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr><!-- Left Column -->\r\n<td style="padding: 20px; width: 334.781px;" valign="top">\r\n<p style="margin: 0; font-weight: bold;">ESA EcoShine Autoreinigungs GmbH</p>\r\n<p style="margin: 8px 0 0 0; font-size: 14px;">If you have any questions, contact us at:<br><span style="text-decoration: underline;"><a style="color: rgb(255, 255, 255); text-decoration: underline;" href="mailto:info@esaecoshine.com">info@esaecoshine.com</a></span></p>\r\n</td>\r\n<!-- Right Column -->\r\n<td style="padding: 20px; width: 182.219px;" align="right" valign="top">\r\n<p style="margin: 0 0 10px 0; font-weight: bold;">Social media</p>\r\n<table border="0" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td style="padding-right: 8px;"><a href="https://www.perfektauto.at/"> <img style="display: block; border: 0;" src="https://development.perfektauto.at/assets/f5e10cfd-2c83-49db-92b7-3dcd8e930749.png?width=168&amp;height=168" alt="Webicon" width="32"> </a></td>\r\n<td style="padding-right: 8px;"><a href="https://www.facebook.com/profile.php?id=61572483477172"> <img style="display: block; border: 0;" src="https://development.perfektauto.at/assets/a616dcd5-3db0-4961-95a2-c996b063fb72.png?width=168&amp;height=168" alt="Facebookicon" width="32"> </a></td>\r\n<td><a href="https://www.linkedin.com/company/perfektauto-gmbh/"> <img style="display: block; border: 0;" src="https://development.perfektauto.at/assets/cc170c32-de19-4ab9-99b8-565086f2c4da.png?width=168&amp;height=168" alt="Linkedinicon" width="32"> </a></td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>',
  },
  {
    languageCode: 'de-DE',
    subject: 'Ihr Führerschein läuft demnächst ab',
    value:
      '<table border="0" width="100%" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td align="center">\r\n<table border="0" width="600" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td>\r\n<p><img style="width: 100%; max-width: 800px; height: auto; display: block;" src="https://development.perfektauto.at/assets/bb75e3fb-092d-4453-9458-0b4646a6570d.png" alt="Email Header Final" width="800"></p>\r\n<h3>Sehr geehrte/r ${FIRST_NAME} ${LAST_NAME},</h3>\r\n<p>wir möchten Sie darüber informieren, dass Ihr Führerschein der Kategorie ${CATEGORY} am ${EXPIRATION_DATE} abläuft.</p>\r\n<p><h3>Bitte erneuern Sie ihn rechtzeitig.</h3></p>\r\n<hr style="border: none; height: 1px; background-color: #add0b6; color: #add0b6;">\r\n<p>Danke f&uuml;r deine Arbeit! ✨</p>\r\n<p style="text-align: left; font-size: 16px;"><strong> <img style="height: 2em; vertical-align: middle; margin-right: 4px;" src="https://development.perfektauto.at/assets/4b82c1c2-49b0-4911-8e82-de600e5b500a.png" alt="Logo"> PerfektAuto Team</strong></p>\r\n<div style="height: 12px; line-height: 12px;">&nbsp;</div>\r\n<table style="background-image: url(\'https://development.perfektauto.at/assets/6ef7b7f1-129d-4dd0-9934-b7f8db5b25d2.png?width=1600&amp;height=374\'); background-repeat: no-repeat; background-size: cover; padding: 20px 0;" border="0" width="100%" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td align="center">\r\n<table style="font-family: Arial, sans-serif; color: #ffffff;" border="0" width="600" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr><!-- Left Column -->\r\n<td style="padding: 20px; width: 334.781px;" valign="top">\r\n<p style="margin: 0; font-weight: bold;">ESA EcoShine Autoreinigungs GmbH</p>\r\n<p style="margin: 8px 0 0 0; font-size: 14px;">Falls Sie Fragen haben, kontaktieren Sie uns unter:<br><span style="text-decoration: underline;"><a style="color: rgb(255, 255, 255); text-decoration: underline;" href="mailto:info@esaecoshine.com">info@esaecoshine.com</a></span></p>\r\n</td>\r\n<!-- Right Column -->\r\n<td style="padding: 20px; width: 182.219px;" align="right" valign="top">\r\n<p style="margin: 0 0 10px 0; font-weight: bold;">Social Media</p>\r\n<table border="0" cellspacing="0" cellpadding="0">\r\n<tbody>\r\n<tr>\r\n<td style="padding-right: 8px;"><a href="https://www.perfektauto.at/"> <img style="display: block; border: 0;" src="https://development.perfektauto.at/assets/f5e10cfd-2c83-49db-92b7-3dcd8e930749.png?width=168&amp;height=168" alt="Webicon" width="32"> </a></td>\r\n<td style="padding-right: 8px;"><a href="https://www.facebook.com/profile.php?id=61572483477172"> <img style="display: block; border: 0;" src="https://development.perfektauto.at/assets/a616dcd5-3db0-4961-95a2-c996b063fb72.png?width=168&amp;height=168" alt="Facebookicon" width="32"> </a></td>\r\n<td><a href="https://www.linkedin.com/company/perfektauto-gmbh/"> <img style="display: block; border: 0;" src="https://development.perfektauto.at/assets/cc170c32-de19-4ab9-99b8-565086f2c4da.png?width=168&amp;height=168" alt="Linkedinicon" width="32"> </a></td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</td>\r\n</tr>\r\n</tbody>\r\n</table>',
  },
];

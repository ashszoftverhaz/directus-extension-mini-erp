export const defaultContractExpirationEmailNotification = {
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
};

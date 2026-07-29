// Email verification template utility functions

// Email verification email template
const verificationEmailTemplate = (code) => `<div style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #ffd700; padding: 30px; text-align: center;">
      <img src="https://altincagkuyumculuk.com/logo.png" alt="AltınÇağ Kuyumculuk" style="width: 150px; height: auto;" />
    </div>
    <div style="padding: 40px; text-align: center;">
      <h2>Email Doğrulama</h2>
      <p>AltınÇağ Kuyumculuk'a hoş geldiniz!</p>
      <p>Lütfen aşağıdaki kodu girerek hesabınızı doğrulayın:</p>
      <div style="font-size: 36px; font-weight: bold; color: #333; margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; letter-spacing: 3px;">${code}</div>
      <p>Bu kod 10 dakika içinde geçerlidir.</p>
      <p>Eğer siz bir hesap oluşturmadıysanız, lütfen bu emaili görmezden gelin.</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      <p>&copy; 2026 AltınÇağ Kuyumculuk. Tüm hakları saklıdır.</p>
      <p>Çağlayan, Vatan Cd. No:55/C, 34403 Kağıthane/İstanbul</p>
    </div>
  </div>
</div>`;

// Email verification success template
const verificationSuccessTemplate = (userName) => `<div style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #28a745; padding: 30px; text-align: center;">
      <img src="https://altincagkuyumculuk.com/logo.png" alt="AltınÇağ Kuyumculuk" style="width: 150px; height: auto;" />
    </div>
    <div style="padding: 40px; text-align: center;">
      <h2>Email Doğrulama Başarılı</h2>
      <p>Sayın ${userName},</p>
      <p>Email adresiniz başarıyla doğrulandı. AltınÇağ Kuyumculuk'a hoş geldiniz!</p>
      <p>Artık tüm özelliklerimizden yararlanabilirsiniz.</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      <p>&copy; 2026 AltınÇağ Kuyumculuk. Tüm hakları saklıdır.</p>
      <p>Çağlayan, Vatan Cd. No:55/C, 34403 Kağıthane/İstanbul</p>
    </div>
  </div>
</div>`;

// Email verification expired template
const verificationExpiredTemplate = (userName) => `<div style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #dc3545; padding: 30px; text-align: center;">
      <img src="https://altincagkuyumculuk.com/logo.png" alt="AltınÇağ Kuyumculuk" style="width: 150px; height: auto;" />
    </div>
    <div style="padding: 40px; text-align: center;">
      <h2>Email Doğrulama Kodunuz Süresi Doldu</h2>
      <p>Sayın ${userName},</p>
      <p>Email doğrulama kodunuzun süresi doldu. Lütfen yeni bir doğrulama kodu istemek için geri alın.</p>
      <p>Şifrenizi mi unuttunuz? <a href="https://altincagkuyumculuk.com/forgot-password">Şifre Sıfırlama</a> bağlantısını tıklayın.</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      <p>&copy; 2026 AltınÇağ Kuyumculuk. Tüm hakları saklıdır.</p>
      <p>Çağlayan, Vatan Cd. No:55/C, 34403 Kağıthane/İstanbul</p>
    </div>
  </div>
</div>`;

module.exports = {
  verificationEmailTemplate,
  verificationSuccessTemplate,
  verificationExpiredTemplate,
};
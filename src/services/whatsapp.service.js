/**
 * ✅ WhatsApp OTP Service
 * Currently in MOCK mode - Console logging only
 * Replace sendOTP function with real API when ready
 */

class WhatsAppService {
  
  /**
   * Generate random OTP
   * @param {number} length - OTP length (default 6)
   * @returns {string} Generated OTP
   */
  generateRandomOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  /**
   * Send OTP via WhatsApp (MOCK MODE)
   * @param {string} mobile - Mobile number
   * @param {string} otp - Optional OTP (if not provided, will generate)
   * @returns {Promise<Object>} Response object
   */
  async sendOTP(mobile, otp = null) {
    try {
      // Generate OTP if not provided
      const finalOTP = otp || this.generateRandomOTP(6);

      // MOCK MODE - Console logging
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║     📱 OTP MOCK MODE (DEVELOPMENT)    ║');
      console.log('╠════════════════════════════════════════╣');
      console.log(`║ Mobile Number : ${mobile.padEnd(23, ' ')}║`);
      console.log(`║ Generated OTP : ${finalOTP.padEnd(23, ' ')}║`);
      console.log(`║ Valid For     : 5 Minutes${' '.repeat(14)}║`);
      console.log(`║ Timestamp     : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }).padEnd(23, ' ')}║`);
      console.log('╚════════════════════════════════════════╝\n');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return success response
      return {
        success: true,
        message: 'OTP generated successfully (Mock Mode)',
        data: {
          mobile,
          otp: finalOTP,
          expiresIn: 300 // 5 minutes in seconds
        }
      };

    } catch (error) {
      console.error('❌ Mock OTP Error:', error.message);
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error.message
      };
    }
  }

  /**
   * Send OTP via Real WhatsApp API
   * Uncomment and configure when ready to use
   */
  /*
  async sendOTPReal(mobile, otp) {
    try {
      const apiUrl = 'https://whatsapp.ksb22.com/api/create-message';
      const appKey = process.env.WHATSAPP_APP_KEY || 'your-app-key';
      const authKey = process.env.WHATSAPP_AUTH_KEY || 'your-auth-key';

      const message = `Your verification OTP is: *${otp}*\n\nValid for 5 minutes only.\n\nDo not share with anyone.`;

      const payload = {
        appkey: appKey,
        authkey: authKey,
        to: `91${mobile}`,
        message: message
      };

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ WhatsApp OTP sent successfully');

      return {
        success: true,
        message: 'OTP sent successfully',
        data: {
          mobile,
          otp,
          messageId: response.data?.messageId || response.data?.id,
          expiresIn: 300
        }
      };

    } catch (error) {
      console.error('❌ WhatsApp API Error:', error.message);
      throw new Error('Failed to send OTP via WhatsApp');
    }
  }
  */
}

export default new WhatsAppService();



// class WhatsAppService {
//   constructor() {
//     this.apiUrl = 'https://whatsapp.ksb22.com/api/create-message';
//     this.appKey = 'ded6dc1a-9af4-400e-8adf-dde7636068dd';
//     this.authKey = 'UinEfMfVct4KpbNZSkT5lBuhqifvIS46AUsi08N3LCwcYxEGOl';
//   }

//   async sendOTP(mobile, otp) {
//     try {
//       const message = `Your verification OTP is: *${otp}*\n\nValid for 5 minutes only.\n\nDo not share with anyone.`;

//       console.log(`📱 Sending OTP to ${mobile}: ${otp}`);
//       console.log(`⏰ Valid for 5 minutes`);

//       // ✅ TRY METHOD 1: Query Parameters in URL
//       const url = `${this.apiUrl}?appkey=${this.appKey}&authkey=${this.authKey}&to=91${mobile}&message=${encodeURIComponent(message)}`;

//       console.log('📤 Trying GET request with query params...');

//       const response = await axios.get(url, {
//         timeout: 10000
//       });

//       console.log('✅ WhatsApp API Response:', response.data);

//       return { 
//         success: true, 
//         messageId: response.data?.messageId || response.data?.id 
//       };

//     } catch (error) {
//       console.error('❌ Method 1 Failed. Trying Method 2...');

//       // ✅ TRY METHOD 2: POST with different format
//       return await this.sendOTPMethod2(mobile, otp);
//     }
//   } 

//   async sendOTPMethod2(mobile, otp) {
//     try {
//       const message = `Your verification OTP is: *${otp}*\n\nValid for 5 minutes only.\n\nDo not share with anyone.`;

//       // Try with direct body object
//       const payload = {
//         appkey: this.appKey,
//         authkey: this.authKey,
//         to: `91${mobile}`,
//         message: message
//       };

//       console.log('📤 Trying POST with JSON body...');

//       const response = await axios.post(this.apiUrl, payload, {
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         timeout: 10000
//       });

//       console.log('✅ WhatsApp API Response:', response.data);

//       return { 
//         success: true, 
//         messageId: response.data?.messageId || response.data?.id 
//       };

//     } catch (error) {
//       console.error('❌ Method 2 Failed. Trying Method 3...');
//       return await this.sendOTPMethod3(mobile, otp);
//     }
//   }

//   async sendOTPMethod3(mobile, otp) {
//     try {
//       const message = `Your verification OTP is: *${otp}*\n\nValid for 5 minutes only.\n\nDo not share with anyone.`;

//       // Try with x-www-form-urlencoded
//       const formBody = `appkey=${this.appKey}&authkey=${this.authKey}&to=91${mobile}&message=${encodeURIComponent(message)}`;

//       console.log('📤 Trying POST with form-urlencoded...');

//       const response = await axios.post(this.apiUrl, formBody, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         timeout: 10000
//       });

//       console.log('✅ WhatsApp API Response:', response.data);

//       return { 
//         success: true, 
//         messageId: response.data?.messageId || response.data?.id 
//       };

//     } catch (error) {
//       console.error('❌ All Methods Failed!');
//       console.error('Status:', error.response?.status);
//       console.error('Data:', error.response?.data);
//       console.error('Headers:', error.response?.headers);

//       throw new Error(
//         error.response?.data?.message || 
//         error.response?.data?.error || 
//         'Failed to send OTP. Please check API credentials.'
//       );
//     }
//   }
// }



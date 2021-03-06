TOTP = function() {

    var dec2hex = function(s) {
        return (s < 15.5 ? "0" : "") + Math.round(s).toString(16);
    };

    var hex2dec = function(s) {
        return parseInt(s, 16);
    };

    var leftpad = function(s, l, p) {
        if(l + 1 >= s.length) {
            s = Array(l + 1 - s.length).join(p) + s;
        }
        return s;
    };

    var base32tohex = function(base32) {
        var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bits = "";
        var hex = "";
        for(var i = 0; i < base32.length; i++) {
            var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += leftpad(val.toString(2), 5, '0');
        }
        for(var i = 0; i + 4 <= bits.length; i+=4) {
            var chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16) ;
        }
        return hex;
    };

    var set_key = function(hmacObj, secret) {
      if(typeof secret === 'string') {
        // Check if it's hex
        if(secret.match(/[0-9a-f]{40}/i)) {
          hmacObj.setHMACKey(secret, "HEX");
        } else {
          // Looks like it's base64
          hmacObj.setHMACKey(secret, "B64");
        }
      }

      return secret;
    }

    this.getOTP = function(secret) {
        try {
            var epoch = Math.round(new Date().getTime() / 1000.0);
            var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, "0");
            var hmacObj = new jsSHA("SHA-1", "HEX");
            set_key(hmacObj, secret);
            hmacObj.update(time);
            var hmac = hmacObj.getHMAC("HEX");
            var offset = hex2dec(hmac.substring(hmac.length - 1));
            var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec("7fffffff")) + "";

            // the steam part
            var chars = '23456789BCDFGHJKMNPQRTVWXY';

            var code = '';

            for(var i = 0; i < 5; i++) {
              code += chars.charAt(otp % chars.length);
              otp /= chars.length;
            }

            // otp = (otp).substr(otp.length - 6, 6);
        } catch (error) {
            throw error;
        }
        return code;
    };

}

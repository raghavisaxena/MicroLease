const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

class Kyc extends Model {
  static initModel(sequelize) {
    Kyc.init({
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      UserId: { type: DataTypes.INTEGER, allowNull: false },
      nameOnId: { type: DataTypes.STRING },
      aadharNumber: { type: DataTypes.STRING },
      aadharMobile: { type: DataTypes.STRING },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      otpHash: { type: DataTypes.STRING },
      otpExpires: { type: DataTypes.DATE },
      verifiedAt: { type: DataTypes.DATE }
    }, { sequelize, modelName: 'Kyc', tableName: 'kycs', timestamps: true });

    // helper to set OTP (hash before save)
    Kyc.prototype.setOtp = async function(plainOtp, ttlMinutes = 10) {
      const hash = await bcrypt.hash(String(plainOtp), 10);
      this.otpHash = hash;
      this.otpExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
      await this.save();
    };

    Kyc.prototype.verifyOtp = async function(plainOtp) {
      if (!this.otpHash || !this.otpExpires) return false;
      if (new Date() > new Date(this.otpExpires)) return false;
      const ok = await bcrypt.compare(String(plainOtp), this.otpHash);
      return ok;
    };

    return Kyc;
  }
}

module.exports = Kyc;

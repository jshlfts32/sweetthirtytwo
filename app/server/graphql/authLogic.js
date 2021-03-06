const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const {
  User, Business, Contractee, PaymentContract,
} = require('../models/index');

const getAuthenticatedUser = context => context.user.then((user) => {
  if (!user) {
    return Promise.reject(Error('Unauthorized'));
  }
  return user;
});

const businessLogic = {
  addBusiness(root, { name, logo }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => Business.create({
        name,
        logo,
        user: currUser._id.toString(),
      }).then((business) => {
        User.findByIdAndUpdate(currUser._id.toString(), { $set: { business } }, { upsert: true, new: true })
          .exec();
        return business;
      }));
  },
  getBusiness(root, args, context) {
    return getAuthenticatedUser(context)
      .then(currUser => Business.findOne({ user: currUser._id.toString() })
        .then((business) => {
          if (business) {
            return business;
          }
          return Promise.reject(Error('No business found.'));
        }));
  },
};

const userLogic = {
  addUser(root, {
    firstName, lastName, email, username, password, business,
  }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => User.findOne({ username })
        .then((existing) => {
          if (!existing && currUser.role === 'owner') {
            return bcrypt.hash(password, 10).then(hash => User.create({
              firstName,
              lastName,
              email,
              password: hash,
              username,
              role: 'user',
              business,
            }));
          }
          return Promise.reject(Error('Username already exists!'));
        }));
  },
  getAllUsers(root, { businessId }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => Business.findById(businessId)
        .then((business) => {
          if (business) {
            if (currUser.business.toString() === businessId && currUser.role.toString() === 'owner') {
              return User.find({ business: businessId })
                .then(users => users);
            }
            return Promise.reject(Error('This user cannot find all users for this business.'));
          }
          return Promise.reject(Error('This business does not exist.'));
        }));
  },
};

const contracteeLogic = {
  addContractee(root, {
    contract_id, first_name, last_name, email, address, business,
  }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => Contractee.findOne({ email })
        .then((existing) => {
          if (!existing) {
            if (currUser.business.toString() === business) {
              return Contractee.create({
                contract_id, first_name, last_name, email, address, business,
              }).then((contractee) => {
                Business.findByIdAndUpdate(business, { $push: { contracts: contractee } }, { upsert: true, new: true })
                  .exec();
                return contractee;
              });
            }
            return Promise.reject(Error('Logged in user cannot add contractee for this business.'));
          }
          return Promise.reject(Error('This contract already exists!'));
        }));
  },
  getBizContracts(root, { businessId }, context) {
    return getAuthenticatedUser(context)
      .then((currUser) => {
        if (currUser.business.toString() === businessId) {
          return Contractee.find({ business: ObjectId(businessId) })
            .then(contracts => contracts);
        }
        return Promise.reject(Error('You cannot get contracts for this business!'));
      });
  },
  getBizContract(root, { contractId }, context) {
    return getAuthenticatedUser(context)
      .then((currUser) => {
        if (currUser) {
          return Contractee.findOne({ _id: contractId })
            .then(contract => contract);
        }
        return Promise.reject(Error('You cannot get contracts for this business!'));
      });
  },
  deleteContract(root, { contracteeId }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => User.findById(currUser._id.toString())
        .then((user) => {
          if (currUser.business.toString() === user.business.toString()) {
            return Contractee.remove({ _id: contracteeId })
              .then((success) => {
                if (success) {
                  PaymentContract.remove({ contractee: contracteeId })
                    .then((removed) => {
                      if (removed) {
                        return 'Payment Contract was deleted.';
                      }
                      return 'No payment contract found.';
                    });
                  return 'Contract was deleted.';
                }
                return Promise.reject(Error('Contractee not deleted.'));
              });
          }
          return Promise.reject(Error('This user cannot delete contractees.'));
        }));
  },
  updateContract(root, {
    contractee, first_name, last_name, email, address, completed, status,
  }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => User.findById(currUser._id.toString())
        .then((user) => {
          if (user) {
            return Contractee.findById(contractee)
              .then((foundContract) => {
                if (first_name !== undefined && first_name !== null && first_name !== '') {
                  foundContract.first_name = first_name;
                }
                if (last_name !== undefined && last_name !== null && last_name !== '') {
                  foundContract.last_name = last_name;
                }
                if (email !== undefined && email !== null && email !== '') {
                  foundContract.email = email;
                }
                if (address !== undefined && address !== null && address !== '') {
                  foundContract.address = address;
                }
                if (completed !== undefined && completed !== null && completed !== '') {
                  foundContract.completed = completed;
                }
                if (status !== undefined && status !== null && status !== '') {
                  foundContract.status = status;
                }
                return foundContract.save();
              });
          }
          return Promise.reject(Error('This user cannot update this contract.'));
        }));
  },
};

const paymentContractLogic = {
  addPaymentContract(root, {
    contractee, total, fees, down_payment, insurance, range, terms,
  }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => Contractee.findOne({ _id: contractee })
        .then((foundContractee) => {
          if (foundContractee._id.toString() === contractee) {
            return PaymentContract.create({
              contractee,
              total,
              fees,
              down_payment,
              insurance,
              range,
              terms,
              monthly_payment: ((total + fees) - down_payment - insurance) / range,
            }).then((payment) => {
              if (payment) {
                return Contractee.findById(contractee);
              }
              return Promise.reject(Error('Payment contract could not be added.'));
            });
          }
          return Promise.reject(Error('Payment contract cannot be added for this contractee!'));
        }));
  },
  getPaymentContract(root, { contractId }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => PaymentContract.findOne({ contractee: ObjectId(contractId) })
        .then((paymentContract) => {
          if (paymentContract) {
            return Contractee.findById(contractId)
              .then((contract) => {
                if (currUser.business.toString() === contract.business.toString()) {
                  return paymentContract;
                }
                return Promise.reject(Error('This payment contract does not belong to this business.'));
              });
          }
          return Promise.reject(Error('This payment contract does not exist.'));
        }));
  },
  updatePaymentContract(root, {
    contractee, total, fees, down_payment, insurance, range, terms,
  }, context) {
    return getAuthenticatedUser(context)
      .then(currUser => User.findById(currUser._id.toString())
        .then((user) => {
          if (user) {
            return PaymentContract.findOne({ contractee })
              .then((paymentContract) => {
                if (!total && total !== null) {
                  paymentContract.total = total;
                }
                if (!fees && fees !== null) {
                  paymentContract.fees = fees;
                }
                if (!down_payment && down_payment !== null) {
                  paymentContract.down_payment = down_payment;
                }
                if (!insurance && insurance !== null) {
                  paymentContract.insurance = insurance;
                }
                if (!range && range !== null) {
                  paymentContract.range = range;
                }
                if (!terms && terms !== null) {
                  paymentContract.terms = terms;
                }
                paymentContract.getMonthlyPayment();
                return paymentContract.save();
              });
          }
          return Promise.reject(Error('This user cannot edit payment contracts for this business.'));
        }).then(paymentContract => Contractee.findById(contractee)));
  },
};

module.exports = {
  businessLogic,
  userLogic,
  contracteeLogic,
  paymentContractLogic,
};

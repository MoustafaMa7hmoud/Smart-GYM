const { Subscription } = require('../model/subscription.model');
const ApiFeatures  = require('../../../utils/apiFeatures');
const {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} = require('../../../utils/constants');
const ApiError = require('../../../utils/ApiError');
const logger   = require('../../../utils/logger');

const PLAN_CATALOGUE = {
  [SUBSCRIPTION_PLANS.BASIC]: {
    pricePerMonth: 199,
    features: [
      'Access to all workout plans',
      'Progress tracking',
      'Exercise library access',
    ],
  },
  [SUBSCRIPTION_PLANS.STANDARD]: {
    pricePerMonth: 399,
    features: [
      'All Basic features',
      'Trainer assignment',
      'Nutrition tips',
      'Priority support',
    ],
  },
  [SUBSCRIPTION_PLANS.PREMIUM]: {
    pricePerMonth: 699,
    features: [
      'All Standard features',
      'Personal trainer sessions',
      'Custom workout plans',
      'Dedicated support channel',
    ],
  },
};

const createSubscription = async (userId, { plan, durationMonths = 1 }) => {
  const catalogue = PLAN_CATALOGUE[plan];
  if (!catalogue) throw new ApiError(400, `Unknown plan: ${plan}`);

  await Subscription.updateMany(
    { user: userId, status: SUBSCRIPTION_STATUSES.ACTIVE },
    { status: SUBSCRIPTION_STATUSES.CANCELLED }
  );

  const price = catalogue.pricePerMonth * durationMonths;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const sub = await Subscription.create({
    user: userId,
    plan,
    durationMonths,
    price,
    currency: 'EGP',
    startDate,
    endDate,
    features: catalogue.features,
    status: SUBSCRIPTION_STATUSES.PENDING,
  });

  logger.info(`Subscription created: ${sub._id} (${plan}, ${durationMonths} month(s))`);
  return sub;
};

const getMySubscription = async (userId) => {
  return Subscription.findOne({
    user: userId,
    status: SUBSCRIPTION_STATUSES.ACTIVE,
  })
    .sort('-createdAt')
    .populate('payment', 'status paidAt amountEGP');
};

const getAllSubscriptions = async (queryString) => {
  const features = new ApiFeatures(
    Subscription.find().populate('user', 'name email'),
    queryString
  ).filter().sort().paginate();

  const [items] = await Promise.all([features.query, features.count()]);
  return { items, meta: features.meta };
};

const activateSubscription = async (subscriptionId, paymentId) => {
  const sub = await Subscription.findByIdAndUpdate(
    subscriptionId,
    { status: SUBSCRIPTION_STATUSES.ACTIVE, payment: paymentId },
    { new: true }
  );
  logger.info(`Subscription activated: ${subscriptionId}`);
  return sub;
};

const cancelSubscription = async (subscriptionId, userId) => {
  const sub = await Subscription.findOne({ _id: subscriptionId, user: userId });
  if (!sub) throw new ApiError(404, 'Subscription not found.');
  if (sub.status === SUBSCRIPTION_STATUSES.CANCELLED)
    throw new ApiError(400, 'Subscription is already cancelled.');

  sub.status = SUBSCRIPTION_STATUSES.CANCELLED;
  await sub.save();
  logger.info(`Subscription cancelled: ${subscriptionId} by user ${userId}`);
  return sub;
};

const getPlanCatalogue = () => PLAN_CATALOGUE;

module.exports = {
  createSubscription,
  getMySubscription,
  getAllSubscriptions,
  activateSubscription,
  cancelSubscription,
  getPlanCatalogue,
};

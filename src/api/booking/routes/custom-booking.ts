module.exports = {
  routes: [
    {
      method: "POST",
      path: "/bookings/create-with-customer",
      handler: "api::booking.booking.createWithCustomer",
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};

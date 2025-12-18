module.exports = {
  routes: [
    {
      method: "POST",
      path: "/bookings/create-with-customer",
      handler: "booking.createWithCustomer",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

/**
 * booking controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::booking.booking",
  ({ strapi }) => ({
    async createWithCustomer(ctx) {
      const { data } = ctx.request.body;
      const { customerData, bookingData, employeeId, serviceId } = data;

      try {
        let customer = await strapi.db.query("api::customer.customer").findOne({
          where: { customer_phone: customerData.phone },
        });

        if (!customer) {
          customer = await strapi.db.query("api::customer.customer").create({
            data: { ...customerData, publishedAt: new Date() },
          });
        }

        const newBooking = await strapi.service("api::booking.booking").create({
          data: {
            ...bookingData,
            customer: customer.id,
            employee: employeeId,
            services: serviceId,
            publishedAt: new Date(),
          },
        });

        return ctx.send({
          message: "Booking created successfully !",
          booking: newBooking,
        });
      } catch (err) {
        strapi.log.error(err);
        return ctx.internalServerError("Create booking failed !");
      }
    },
  })
);

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
        let bookingCode = "";
        let isUnique = false;

        while (!isUnique) {
          const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let randomPart = "";
          for (let i = 0; i < 6; i++) {
            randomPart += characters.charAt(
              Math.floor(Math.random() * characters.length)
            );
          }
          bookingCode = `BK-${randomPart}`;
          const existingBooking = await strapi.db
            .query("api::booking.booking")
            .findOne({
              where: { booking_code: bookingCode },
            });

          if (!existingBooking) {
            isUnique = true;
          }
        }
        const newBooking = await strapi.service("api::booking.booking").create({
          data: {
            ...bookingData,
            customer: customer.id,
            employee: employeeId,
            services: serviceId,
            booking_code: bookingCode,
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

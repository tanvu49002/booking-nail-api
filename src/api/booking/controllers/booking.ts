/**
 * booking controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::booking.booking",
  ({ strapi }) => ({
    async createWithCustomer(ctx) {
      const { data } = ctx.request.body;
      const {
        customerName,
        customerPhone,
        customerEmail,
        bookingDate,
        bookingTime,
        bookingNote,
        employeeId,
        serviceId,
      } = data;

      try {
        let customer = await strapi.db.query("api::customer.customer").findOne({
          where: { customer_phone: customerPhone },
        });

        if (!customer) {
          customer = await strapi.db.query("api::customer.customer").create({
            data: {
              customer_name: customerName,
              customer_phone: customerPhone,
              customer_email: customerEmail,
              publishedAt: new Date(),
            },
          });
        }
        const services = await strapi.db
          .query("api::service.service")
          .findMany({
            where: { id: { $in: serviceId } },
          });

        if (!services || services.length === 0) {
          return ctx.badRequest("Service not found!");
        }

        // Cộng dồn tất cả working_time (phút)
        const totalWorkingTime = services.reduce((total, s) => {
          return total + (Number(s.working_time) || 0);
        }, 0);

        // 3. Tính toán booking_end
        const startTime = new Date(`${bookingDate}T${bookingTime}`);
        const endTime = new Date(
          startTime.getTime() + totalWorkingTime * 60000
        );

        // Chuyển định dạng về HH:mm:ss
        const bookingEnd = endTime.toTimeString().split(" ")[0];
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
            booking_date: bookingDate,
            booking_time: bookingTime,
            booking_end: bookingEnd,
            note: bookingNote,
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
